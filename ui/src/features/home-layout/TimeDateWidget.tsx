import { useState, useEffect } from "react";
import "./time-date-widget.css";

const TimeDateWidget = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const date = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="time-date-widget">
      <div className="time-text">{time}</div>
      <div className="date-text">{date}</div>
    </div>
  );
};

export default TimeDateWidget;
