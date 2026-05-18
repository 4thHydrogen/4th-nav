package goscraper

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"golang.org/x/net/html"
	"golang.org/x/net/html/charset"
)

var (
	EscapedFragment string = "_escaped_fragment_="
	fragmentRegexp         = regexp.MustCompile("#!(.*)")
)

type Scraper struct {
	Url                *url.URL
	EscapedFragmentUrl *url.URL
	MaxRedirect        int
	ProxyURL           string
}

type Document struct {
	Body    bytes.Buffer
	Preview DocumentPreview
}

type IconCandidate struct {
	URL   string
	Sizes string
	Type  string
	Rel   string
}

type DocumentPreview struct {
	Icon        string
	Icons       []IconCandidate
	Name        string
	Title       string
	Description string
	Images      []string
	Link        string
}

func iconTypePriority(iconType string) int {
	t := strings.ToLower(iconType)
	if strings.Contains(t, "svg") {
		return 3
	}
	if strings.Contains(t, "png") {
		return 2
	}
	return 1
}

func iconSizeScore(sizes string) int {
	s := strings.ToLower(sizes)
	if strings.Contains(s, "any") {
		return 999
	}
	parts := strings.Split(s, "x")
	if len(parts) == 2 {
		w, err := strconv.Atoi(strings.TrimSpace(parts[0]))
		if err == nil {
			return w
		}
	}
	return 0
}

func iconExtPriority(u string) int {
	l := strings.ToLower(u)
	if strings.Contains(l, ".svg") {
		return 3
	}
	if strings.Contains(l, ".png") {
		return 2
	}
	return 1
}

func (dp *DocumentPreview) SelectBestIcon() string {
	if len(dp.Icons) == 0 {
		return dp.Icon
	}
	candidates := make([]IconCandidate, len(dp.Icons))
	copy(candidates, dp.Icons)
	sort.SliceStable(candidates, func(i, j int) bool {
		iTypePri := iconTypePriority(candidates[i].Type)
		jTypePri := iconTypePriority(candidates[j].Type)
		if iTypePri != jTypePri {
			return iTypePri > jTypePri
		}
		iExtPri := iconExtPriority(candidates[i].URL)
		jExtPri := iconExtPriority(candidates[j].URL)
		if iExtPri != jExtPri {
			return iExtPri > jExtPri
		}
		iSize := iconSizeScore(candidates[i].Sizes)
		jSize := iconSizeScore(candidates[j].Sizes)
		return iSize > jSize
	})
	return candidates[0].URL
}

func Scrape(uri string, maxRedirect int) (*Document, error) {
	u, err := url.Parse(uri)
	if err != nil {
		return nil, err
	}
	return (&Scraper{Url: u, MaxRedirect: maxRedirect}).Scrape()
}

func ScrapeWithProxy(u *url.URL, maxRedirect int, proxyURL string) (*Document, error) {
	return (&Scraper{Url: u, MaxRedirect: maxRedirect, ProxyURL: proxyURL}).Scrape()
}

func (scraper *Scraper) Scrape() (*Document, error) {
	doc, err := scraper.getDocument()
	if err != nil {
		return nil, err
	}
	err = scraper.parseDocument(doc)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func (scraper *Scraper) getUrl() string {
	if scraper.EscapedFragmentUrl != nil {
		return scraper.EscapedFragmentUrl.String()
	}
	return scraper.Url.String()
}

func (scraper *Scraper) toFragmentUrl() error {
	unescapedurl, err := url.QueryUnescape(scraper.Url.String())
	if err != nil {
		return err
	}
	matches := fragmentRegexp.FindStringSubmatch(unescapedurl)
	if len(matches) > 1 {
		escapedFragment := EscapedFragment
		for _, r := range matches[1] {
			b := byte(r)
			if avoidByte(b) {
				continue
			}
			if escapeByte(b) {
				escapedFragment += url.QueryEscape(string(r))
			} else {
				escapedFragment += string(r)
			}
		}

		p := "?"
		if len(scraper.Url.Query()) > 0 {
			p = "&"
		}
		fragmentUrl, err := url.Parse(strings.Replace(unescapedurl, matches[0], p+escapedFragment, 1))
		if err != nil {
			return err
		}
		scraper.EscapedFragmentUrl = fragmentUrl
	} else {
		p := "?"
		if len(scraper.Url.Query()) > 0 {
			p = "&"
		}
		fragmentUrl, err := url.Parse(unescapedurl + p + EscapedFragment)
		if err != nil {
			return err
		}
		scraper.EscapedFragmentUrl = fragmentUrl
	}
	return nil
}

func (scraper *Scraper) getDocument() (*Document, error) {
	scraper.MaxRedirect -= 1
	if strings.Contains(scraper.Url.String(), "#!") {
		scraper.toFragmentUrl()
	}
	if strings.Contains(scraper.Url.String(), EscapedFragment) {
		scraper.EscapedFragmentUrl = scraper.Url
	}

	req, err := http.NewRequest("GET", scraper.getUrl(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36")
	req.Header.Add("Host", scraper.Url.Host)

	var client *http.Client
	if scraper.ProxyURL != "" {
		if proxyParsed, err := url.Parse(scraper.ProxyURL); err == nil {
			client = &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyParsed)}}
		} else {
			client = &http.Client{}
		}
	} else {
		client = &http.Client{}
	}

	resp, err := client.Do(req)
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return nil, err
	}

	if resp.Request.URL.String() != scraper.getUrl() {
		scraper.EscapedFragmentUrl = nil
		scraper.Url = resp.Request.URL
	}
	b, err := convertUTF8(resp.Body, resp.Header.Get("content-type"))
	if err != nil {
		return nil, err
	}
	doc := &Document{Body: b, Preview: DocumentPreview{Link: scraper.Url.String()}}

	return doc, nil
}

func convertUTF8(content io.Reader, contentType string) (bytes.Buffer, error) {
	buff := bytes.Buffer{}
	content, err := charset.NewReader(content, contentType)
	if err != nil {
		return buff, err
	}
	_, err = io.Copy(&buff, content)
	if err != nil {
		return buff, err
	}
	return buff, nil
}

func (scraper *Scraper) parseDocument(doc *Document) error {
	t := html.NewTokenizer(&doc.Body)
	var ogImage bool
	var headPassed bool
	var hasFragment bool
	var hasCanonical bool
	var canonicalUrl *url.URL
	doc.Preview.Images = []string{}
	doc.Preview.Icons = []IconCandidate{}
	link := doc.Preview.Link
	doc.Preview.Name = scraper.Url.Host
	doc.Preview.Icon = fmt.Sprintf("%s://%s%s", scraper.Url.Scheme, scraper.Url.Host, "/favicon.ico")
	for {
		tokenType := t.Next()
		if tokenType == html.ErrorToken {
			return nil
		}
		if tokenType != html.SelfClosingTagToken && tokenType != html.StartTagToken && tokenType != html.EndTagToken {
			continue
		}
		token := t.Token()

		switch token.Data {
		case "head":
			if tokenType == html.EndTagToken {
				headPassed = true
			}
		case "body":
			headPassed = true

		case "link":
			var canonical bool
			var hasIcon bool
			var href string
			var iconSizes string
			var iconType string
			var iconRel string
			for _, attr := range token.Attr {
				k := cleanStr(attr.Key)
				v := cleanStr(attr.Val)
				if k == "rel" && v == "canonical" {
					canonical = true
				}
				if k == "rel" && (strings.Contains(v, "icon") || strings.Contains(v, "apple-touch-icon")) {
					hasIcon = true
					iconRel = v
				}
				if k == "href" {
					href = attr.Val
				}
				if k == "sizes" {
					iconSizes = attr.Val
				}
				if k == "type" {
					iconType = attr.Val
				}
				if len(href) > 0 && canonical && link != href {
					hasCanonical = true
					var err error
					canonicalUrl, err = url.Parse(href)
					if err != nil {
						return err
					}
				}
			}
			if len(href) > 0 && hasIcon {
				doc.Preview.Icons = append(doc.Preview.Icons, IconCandidate{
					URL:   href,
					Sizes: iconSizes,
					Type:  iconType,
					Rel:   iconRel,
				})
				doc.Preview.Icon = href
			}

		case "meta":
			if len(token.Attr) != 2 {
				break
			}
			if metaFragment(token) && scraper.EscapedFragmentUrl == nil {
				hasFragment = true
			}
			var property string
			var content string
			for _, attr := range token.Attr {
				if cleanStr(attr.Key) == "property" || cleanStr(attr.Key) == "name" {
					property = attr.Val
				}
				if cleanStr(attr.Key) == "content" {
					content = attr.Val
				}
			}
			switch cleanStr(property) {
			case "og:site_name":
				doc.Preview.Name = content
			case "og:title":
				doc.Preview.Title = content
			case "og:description":
				doc.Preview.Description = content
			case "description":
				if len(doc.Preview.Description) == 0 {
					doc.Preview.Description = content
				}
			case "og:url":
				doc.Preview.Link = content
			case "og:image":
				ogImage = true
				ogImgUrl, err := url.Parse(content)
				if err != nil {
					return err
				}
				if !ogImgUrl.IsAbs() {
					ogImgUrl, err = url.Parse(fmt.Sprintf("%s://%s%s", scraper.Url.Scheme, scraper.Url.Host, ogImgUrl.Path))
					if err != nil {
						return err
					}
				}

				doc.Preview.Images = []string{ogImgUrl.String()}

			}

		case "title":
			if tokenType == html.StartTagToken {
				t.Next()
				token = t.Token()
				if len(doc.Preview.Title) == 0 {
					doc.Preview.Title = token.Data
				}
			}

		case "img":
			for _, attr := range token.Attr {
				if cleanStr(attr.Key) == "src" {
					imgUrl, err := url.Parse(attr.Val)
					if err != nil {
						return err
					}
					if !imgUrl.IsAbs() {
						doc.Preview.Images = append(doc.Preview.Images, fmt.Sprintf("%s://%s%s", scraper.Url.Scheme, scraper.Url.Host, imgUrl.Path))
					} else {
						doc.Preview.Images = append(doc.Preview.Images, attr.Val)
					}

				}
			}
		}

		if hasCanonical && headPassed && scraper.MaxRedirect > 0 {
			if !canonicalUrl.IsAbs() {
				absCanonical, err := url.Parse(fmt.Sprintf("%s://%s%s", scraper.Url.Scheme, scraper.Url.Host, canonicalUrl.Path))
				if err != nil {
					return err
				}
				canonicalUrl = absCanonical
			}
			scraper.Url = canonicalUrl
			scraper.EscapedFragmentUrl = nil
			fdoc, err := scraper.getDocument()
			if err != nil {
				return err
			}
			*doc = *fdoc
			return scraper.parseDocument(doc)
		}

		if hasFragment && headPassed && scraper.MaxRedirect > 0 {
			scraper.toFragmentUrl()
			fdoc, err := scraper.getDocument()
			if err != nil {
				return err
			}
			*doc = *fdoc
			return scraper.parseDocument(doc)
		}

		if len(doc.Preview.Title) > 0 && len(doc.Preview.Description) > 0 && ogImage && headPassed {
			return nil
		}

	}

	return nil
}

func avoidByte(b byte) bool {
	i := int(b)
	if i == 127 || (i >= 0 && i <= 31) {
		return true
	}
	return false
}

func escapeByte(b byte) bool {
	i := int(b)
	if i == 32 || i == 35 || i == 37 || i == 38 || i == 43 || (i >= 127 && i <= 255) {
		return true
	}
	return false
}

func metaFragment(token html.Token) bool {
	var name string
	var content string

	for _, attr := range token.Attr {
		if cleanStr(attr.Key) == "name" {
			name = attr.Val
		}
		if cleanStr(attr.Key) == "content" {
			content = attr.Val
		}
	}
	if name == "fragment" && content == "!" {
		return true
	}
	return false
}

func cleanStr(str string) string {
	return strings.ToLower(strings.TrimSpace(str))
}
