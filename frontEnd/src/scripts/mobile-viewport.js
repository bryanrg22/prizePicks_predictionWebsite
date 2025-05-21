// This script adds the viewport meta tag for proper mobile scaling
;(() => {
  // Check if viewport meta tag already exists
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement("meta")
    meta.name = "viewport"
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    document.head.appendChild(meta)
  }
})()
