# ftp-sync
Uploads locals files via ftp

### How To Use:
1. run `npm run setup`. This duplicates example config to `dp-ftp-config.json`
2. Edit `dp-ftp-config.json` appropriately
3. run `npm start`

#### Example Config
```
{
  "host" : "host.com",
  "user" : "username",
  "password" : "password",
  "remote" : "public_html/relative/path/to/ftp/root",
  "local" : "/absolute/local/path",
  "ignore" : ["**/node_modules/**/*"],
  "DEBUG_MED" : true
}
```
