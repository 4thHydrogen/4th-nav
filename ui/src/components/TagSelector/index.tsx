import "./index.css";
import { useCallback } from "react";
interface TagSelectorProps {
  tags: any;
  onTagChange: (newTag: string) => void;
  onMiddleClick?: (tag: string) => void;
  currTag: string;
}
const TagSelector = (props: TagSelectorProps) => {
  const { tags = ["all"], onTagChange, onMiddleClick, currTag } = props;
  const renderTags = useCallback(() => {
    const originTags =  tags.map((each) => {
      // 处理空分类，显示为"未分类"
      const displayText = each === null || each === undefined || each === "" || (typeof each === 'string' && each.trim() === "") 
        ? "未分类" 
        : each;
      
      return (
        <span
          className={`select-tag ${
            currTag === each ? "select-tag-active" : ""
          }`}
          key={`${each}-select-tag`}
          onClick={() => {
            onTagChange(each);
          }}
          onAuxClick={(e) => {
            if (e.button === 1 && onMiddleClick) {
              e.preventDefault();
              onMiddleClick(each);
            }
          }}
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
            }
          }}
        >
          {displayText}
        </span>
      );
    });
    return originTags;
  }, [tags, onTagChange, onMiddleClick, currTag]);
  return (
    <div className="tag-selector span-3">
      <div className="tag-selector-wrapper">
        {renderTags()}
      </div>
    </div>
  );
};

export default TagSelector;
