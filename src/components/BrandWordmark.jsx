import {
  Link,
} from "react-router-dom";

import "./BrandWordmark.css";


export default function BrandWordmark({

  to = "/",

  variant = "default",

  className = "",

}) {

  const classes = [

    "brand-wordmark",

    variant === "light"
      ? "brand-wordmark-light"
      : "",

    className,

  ]
    .filter(Boolean)
    .join(" ");


  return (

    <Link

      to={to}

      className={classes}

      aria-label="mutespeak home"

    >

      mutespeak;

    </Link>

  );

}