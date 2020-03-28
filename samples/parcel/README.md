# parcel

Works fine, but there is no way to exclude modules so any component library build forever

```json
"targets":{
  "dev": {
     "includeNodeModules": {
        "react": false,
        "react-dom": false
      }
  }
}
```
