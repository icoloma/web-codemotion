# Codemotion website

The contents of the http://codemotion.es website.

## Quick start

```bash
sudo apt-get install libjpeg-dev libgif-dev tmux 
git clone https://github.com/icoloma/web-codemotion.git
cd web-codemotion
sudo npm install -g gulp node-inspector 
sudo gem install jekyll cairo tmuxinator   # or sudo gem update
npm install
```

After installing properly, execute in two separate shells

```bash
gulp
bin/jekyll
```

Alternatively, there is a tmuxinator config file included

```
mkdir -p ~/.tmuxinator
ln -s $(pwd)/codemotion.yml ~/.tmuxinator
tmuxinator codemotion
```

Building:

```bash
# watch for modifications in source files and copy into dist/
gulp

# launch jekyll in the dist/ folder
bin/jekyll

# download logos from new communities 
bin/update-logos
gulp sprites copy

# create a gray version of a modified logo 
bin/gray src/img/communities/orig/file.jpg

# download talks
bin/update-talks

# upload current Jekyll contents to production
git clone -b gh-pages git@github.com:icoloma/web-codemotion.git web-codemotion-publish
bin/publish

# update fontello font (after downloading)
bin/fontello-update
```

