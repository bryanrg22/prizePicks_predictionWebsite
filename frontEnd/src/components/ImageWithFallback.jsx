"use client"

import { useState } from "react"

const ImageWithFallback = ({ src, alt, fallbackSrc, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src)

  const handleError = () => {
    setImgSrc(fallbackSrc || "/placeholder.svg")
  }

  return <img src={imgSrc || "/placeholder.svg"} alt={alt} onError={handleError} {...props} />
}

export default ImageWithFallback