# Codemotion website

The contents of the http://codemotion.es website.

## Quick start

```bash
git clone https://github.com/icoloma/web-codemotion.git
cd web-codemotion
sudo npm install -g gulp node-inspector 
sudo gem install jekyll cairo
sudo apt-get install libjpeg-dev libgif-dev     # for css-sprites
npm install
```

Also (probably)

```bash
sudo npm update -g npm
sudo npm install -g n
sudo n 0.10 # or latest?

```

Building:

```bash
# watch for modifications in source files and copy into dist/
gulp

# launch jekyll in the dist/ folder
cd dist && bin/jekyll

# download logos from new communities 
bin/update-logos

# download talks
bin/update-talks

# create a gray version of a modified logo 
bin/gray src/img/communities/orig/file.jpg

# update fontello font (after downloading)
bin/fontello-update
```


