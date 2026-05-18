import { useEffect } from "react";
import "./index.css";
// import { useState } from 'react';

interface SearchBarProps {
  setSearchText: (t: string) => void;
  searchString: string;
}
const SearchBar = (props: SearchBarProps) => {
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const reg = /[a-zA-Z0-9]|[\u4e00-\u9fa5]/g;
      if (ev.code === "Enter" || reg.test(ev.key)) {
        const el = document.getElementById("search-bar");
        if (el) {
          el.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [])
  return (
    <div className="search span-3">
      <div className="search-wraper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="search-bar"
          type="search"
          placeholder="按任意键直接开始搜索"
          value={props.searchString}
          onChange={(ev) => {
            const v = ev.target.value
            props.setSearchText(v);
          }}
        ></input>
        <span className="search-hint">/</span>
      </div>
    </div>
  );
};

export default SearchBar;
