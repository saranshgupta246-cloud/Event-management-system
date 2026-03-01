import React, { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

function useCount(end, duration, inView) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, inView]);
  return count;
}

export default function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const count = useCount(end, duration, inView);
  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}
