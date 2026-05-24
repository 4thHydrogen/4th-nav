import SearchBar from "../search/SearchBar";
import TimeDateWidget from "./TimeDateWidget";
import type { SearchEngine } from "../../types";

interface HomeHeroProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSelectedEngineChange: (engine: SearchEngine | null) => void;
}

export function HomeHero({
  searchValue,
  onSearchValueChange,
  onSelectedEngineChange,
}: HomeHeroProps) {
  return (
    <section className="desktop-hero">
      <div className="desktop-hero-inner">
        <TimeDateWidget />
        <div className="desktop-search-shell">
          <SearchBar
            searchString={searchValue}
            setSearchText={onSearchValueChange}
            onSelectedEngineChange={onSelectedEngineChange}
          />
        </div>
      </div>
    </section>
  );
}
