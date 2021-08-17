window.addEventListener("load", function() {

  localforage.setDriver(localforage.LOCALSTORAGE);

  const state = new KaiState({});

  const helpSupportPage = new Kai({
    name: 'helpSupportPage',
    data: {
      title: 'helpSupportPage'
    },
    templateUrl: document.location.origin + '/templates/helpnsupport.html',
    mounted: function() {
      this.$router.setHeaderTitle('Help & Support');
    },
    unmounted: function() {},
    methods: {},
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {},
      right: function() {}
    }
  });

  const viewDefinition = function($router, name, definition, style) {
    $router.push(
      new Kai({
        name: 'viewDefinition',
        data: {
          title: 'viewDefinition'
        },
        template: `<div  id="__viewDefinition__" class="kui-flex-wrap kai-padding-5" style="font-size:100%"><style>${style}</style>${definition}</div>`,
        mounted: function() {
          this.$router.setHeaderTitle(name);
          const firstP = document.querySelector('p');
          if (firstP.innerHTML.indexOf('entry') > -1) {
            firstP.innerHTML = '';
          }
        },
        unmounted: function() {},
        methods: {},
        softKeyText: { left: '-', center: 'SELECT', right: '+' },
        softKeyListener: {
          left: function() {
            var current = parseInt(document.getElementById('__viewDefinition__').style.fontSize);
            current -= 10;
            if (current < 60)
              return
            else
              document.getElementById('__viewDefinition__').style.fontSize = `${current}%`
            $router.showToast(`${current}%`);
          },
          center: function() {
            
          },
          right: function() {
            var current = parseInt(document.getElementById('__viewDefinition__').style.fontSize);
            current += 10;
            if (current > 180)
              return
            else
              document.getElementById('__viewDefinition__').style.fontSize = `${current}%`
            $router.showToast(`${current}%`);
          }
        }
      })
    );
  }

  const loadMDX = function($router, file, style) {
    const paths = file.name.split('/');
    const n = paths[paths.length - 1];
    require(['mdict-common', 'mdict-parser', 'mdict-renderer'], function(MCommon, MParser, MRenderer) {
      MParser([file])
      .then((resources) => {
        var mdict = MRenderer(resources);
        $router.push(
          new Kai({
            name: 'search',
            data: {
              title: 'search',
              empty: true,
              result: [],
              keyword: '',
            },
            verticalNavClass: '.searchNav',
            templateUrl: document.location.origin + '/templates/search.html',
            mounted: function() {
              $router.setHeaderTitle(n);
              this.methods.renderSoftKey();
            },
            unmounted: function() {},
            methods: {
              search: function(keyword) {
                this.data.keyword = keyword;
                if (keyword == '' || keyword.length === 0) {
                  this.verticalNavIndex = -1;
                  this.setData({ result: [], empty: true });
                  this.methods.renderSoftKey();
                  return
                }
                mdict.search({phrase: keyword, max: 100})
                .then((list) => {
                  list = list.map((v) => {
                    return {word: v.toString(), value: v.offset};
                  });
                  this.verticalNavIndex = -1;
                  this.setData({ result: list, empty: !(list.length > 0) });
                  this.methods.renderSoftKey();
                });
              },
              renderSoftKey: function() {
                if (this.data.result.length > 0)
                  $router.setSoftKeyText('Search', 'SELECT', '');
                else
                  $router.setSoftKeyText('Search', '', '');
              }
            },
            softKeyText: { left: 'Search', center: '', right: '' },
            softKeyListener: {
              left: function() {
                const searchDialog = Kai.createDialog('Search', `<div><input id="search-input" placeholder="Enter your keyword" class="kui-input" type="text"/></div>`, null, '', undefined, '', undefined, '', undefined, undefined, this.$router);
                searchDialog.mounted = () => {
                  setTimeout(() => {
                    setTimeout(() => {
                      this.$router.setSoftKeyText('Cancel' , '', 'Go');
                    }, 103);
                    const SEARCH_INPUT = document.getElementById('search-input');
                    if (!SEARCH_INPUT) {
                      return;
                    }
                    SEARCH_INPUT.focus();
                    SEARCH_INPUT.value = this.data.keyword;
                    SEARCH_INPUT.addEventListener('keydown', (evt) => {
                      switch (evt.key) {
                        case 'Backspace':
                        case 'EndCall':
                          if (document.activeElement.value.length === 0) {
                            this.$router.hideBottomSheet();
                            setTimeout(() => {
                              SEARCH_INPUT.blur();
                            }, 100);
                          }
                          break
                        case 'SoftRight':
                          this.$router.hideBottomSheet();
                          setTimeout(() => {
                            SEARCH_INPUT.blur();
                            this.methods.search(SEARCH_INPUT.value);
                          }, 100);
                          break
                        case 'SoftLeft':
                          this.$router.hideBottomSheet();
                          setTimeout(() => {
                            SEARCH_INPUT.blur();
                          }, 100);
                          break
                      }
                    });
                  });
                }
                searchDialog.dPadNavListener = {
                  arrowUp: function() {
                    const SEARCH_INPUT = document.getElementById('search-input');
                    SEARCH_INPUT.focus();
                  },
                  arrowDown: function() {
                    const SEARCH_INPUT = document.getElementById('search-input');
                    SEARCH_INPUT.focus();
                  }
                }
                this.$router.showBottomSheet(searchDialog);
              },
              center: function() {
                var selected = this.data.result[this.verticalNavIndex];
                if (selected) {
                  $router.showLoading();
                  mdict.lookup(selected.word)
                  .then((content) => {
                    if (DOMPurify) {
                      content = DOMPurify.sanitize(content)
                    }
                    viewDefinition($router, selected.word, content, style);
                  })
                  .finally(() => {
                    $router.hideLoading();
                  })
                }
              },
              right: function() {}
            },
            dPadNavListener: {
              arrowUp: function() {
                this.navigateListNav(-1);
              },
              arrowDown: function() {
                this.navigateListNav(1);
              }
            }
          })
        );
      });
    });
  }

  const home = new Kai({
    name: 'home',
    data: {
      title: 'home',
      mdxs: []
    },
    verticalNavClass: '.mdxsNav',
    templateUrl: document.location.origin + '/templates/home.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Load MDX');
      localforage.getItem('DB_MDXS')
      .then((mdxs) => {
        if (!mdxs) {
          window['__DS__'] = new DataStorage(this.methods.onChange, this.methods.onReady);
          setTimeout(() => {
            this.$router.showToast('Please `Kill App` if you think the app was hang');
          }, 30000);
        } else {
          this.setData({mdxs: mdxs});
          this.methods.renderSoftKey();
        }
      });
    },
    unmounted: function() {
      if (window['__DS__']) {
        window['__DS__'].destroy();
      }
    },
    methods: {
      selected: function() {},
      onChange: function(fileRegistry, documentTree, groups) {
        this.methods.runFilter(fileRegistry);
      },
      onReady: function(status) {
        if (status) {
          this.$router.hideLoading();
        } else {
          this.$router.showLoading(false);
        }
      },
      runFilter: function(fileRegistry) {
        this.verticalNavIndex = -1;
        var mdxs = []
        fileRegistry.forEach((file) => {
          var n = file.split('/');
          var n1 = n[n.length - 1];
          var n2 = n1.split('.');
          if (n2.length > 1) {
            if (n2[n2.length - 1] === 'mdx') {
              mdxs.push({'name': n1, 'path': file});
            }
          }
        });
        mdxs.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
        this.setData({mdxs: mdxs});
        this.methods.renderSoftKey();
        localforage.setItem('DB_MDXS', mdxs);
      },
      search: function(keyword) {
        this.verticalNavIndex = -1;
        localforage.getItem('DB_MDXS')
        .then((mdxs) => {
          if (!mdxs) {
            mdxs = [];
          }
          var result = [];
          mdxs.forEach((mdx) => {
            if (keyword === '' || (mdx.name.toLowerCase().indexOf(keyword.toLowerCase()) > -1)) {
              result.push(mdx);
            }
          });
          result.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
          this.setData({mdxs: result});
          this.methods.renderSoftKey();
        });
      },
      openMdx: function(DS, path, style) {
        this.$router.showLoading();
        DS.getFile(path, (mdxBlob) => {
          this.$router.hideLoading();
          loadMDX(this.$router, mdxBlob, style);
        }, (err) => {
          this.$router.hideLoading();
          this.$router.showToast(err.toString());
        })
      },
      renderSoftKey: function() {
        console.log(this.data.mdxs.length);
        if (this.data.mdxs.length > 0)
          this.$router.setSoftKeyText('Menu', 'OPEN', 'Kill App');
        else
          this.$router.setSoftKeyText('Menu', '', 'Kill App');
      }
    },
    softKeyText: { left: 'Menu', center: '', right: 'Kill App' },
    softKeyListener: {
      left: function() {
        var menu = [
          {'text': 'Search'},
          {'text': 'Reload Library'},
          {'text': 'Help & Support'},
        ]
        this.$router.showOptionMenu('Menu', menu, 'SELECT', (selected) => {
          if (selected.text === 'Reload Library') {
            window['__DS__'] = new DataStorage(this.methods.onChange, this.methods.onReady);
          } else if (selected.text === 'Help & Support') {
            this.$router.push('helpSupportPage');
          } else if (selected.text === 'Search') {
            const searchDialog = Kai.createDialog('Search', '<div><input id="search-input" placeholder="Enter your keyword" class="kui-input" type="text" /></div>', null, '', undefined, '', undefined, '', undefined, undefined, this.$router);
            searchDialog.mounted = () => {
              setTimeout(() => {
                setTimeout(() => {
                  this.$router.setSoftKeyText('Cancel' , '', 'Go');
                }, 103);
                const SEARCH_INPUT = document.getElementById('search-input');
                if (!SEARCH_INPUT) {
                  return;
                }
                SEARCH_INPUT.focus();
                SEARCH_INPUT.addEventListener('keydown', (evt) => {
                  switch (evt.key) {
                    case 'Backspace':
                    case 'EndCall':
                      if (document.activeElement.value.length === 0) {
                        this.$router.hideBottomSheet();
                        setTimeout(() => {
                          SEARCH_INPUT.blur();
                        }, 100);
                      }
                      break
                    case 'SoftRight':
                      this.$router.hideBottomSheet();
                      setTimeout(() => {
                        SEARCH_INPUT.blur();
                        this.methods.search(SEARCH_INPUT.value);
                      }, 100);
                      break
                    case 'SoftLeft':
                      this.$router.hideBottomSheet();
                      setTimeout(() => {
                        SEARCH_INPUT.blur();
                      }, 100);
                      break
                  }
                });
              });
            }
            searchDialog.dPadNavListener = {
              arrowUp: function() {
                const SEARCH_INPUT = document.getElementById('search-input');
                SEARCH_INPUT.focus();
              },
              arrowDown: function() {
                const SEARCH_INPUT = document.getElementById('search-input');
                SEARCH_INPUT.focus();
              }
            }
            this.$router.showBottomSheet(searchDialog);
          }
        }, null);
      },
      center: function() {
        var selected = this.data.mdxs[this.verticalNavIndex];
        if (selected) {
          var DS;
          if (window['__DS__'])
            DS = window['__DS__'];
          else
            DS = new DataStorage();
          DS.getFile(selected.path.replace(new RegExp('.mdx$'), '.css'), (styleBlob) => {
            var reader = new FileReader();
            reader.readAsText(styleBlob);
            reader.onload = () => {
              this.methods.openMdx(DS, selected.path, reader.result);
            }
            reader.onerror = () => {
              this.methods.openMdx(DS, selected.path, '');
            }
          }, (err) => {
            this.methods.openMdx(DS, selected.path, '');
          });
        }
      },
      right: function() {
        window.close();
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    },
    backKeyListener: function() {}
  });

  const router = new KaiRouter({
    title: 'KaiKit',
    routes: {
      'index' : {
        name: 'home',
        component: home
      },
      'helpSupportPage': {
        name: 'helpSupportPage',
        component: helpSupportPage
      },
    }
  });

  const app = new Kai({
    name: '_APP_',
    data: {},
    templateUrl: document.location.origin + '/templates/template.html',
    mounted: function() {},
    unmounted: function() {},
    router,
    state
  });

  try {
    app.mount('app');
  } catch(e) {
    console.log(e);
  }

  function displayKaiAds() {
    var display = true;
    if (window['kaiadstimer'] == null) {
      window['kaiadstimer'] = new Date();
    } else {
      var now = new Date();
      if ((now - window['kaiadstimer']) < 300000) {
        display = false;
      } else {
        window['kaiadstimer'] = now;
      }
    }
    console.log('Display Ads:', display);
    if (!display)
      return;
    getKaiAd({
      publisher: 'ac3140f7-08d6-46d9-aa6f-d861720fba66',
      app: 'mdict',
      slot: 'kaios',
      onerror: err => console.error(err),
      onready: ad => {
        ad.call('display')
        ad.on('close', () => {
          app.$router.hideBottomSheet();
          document.body.style.position = '';
        });
        ad.on('display', () => {
          app.$router.hideBottomSheet();
          document.body.style.position = '';
        });
      }
    })
  }

  displayKaiAds();

  document.addEventListener('visibilitychange', function(ev) {
    if (document.visibilityState === 'visible') {
      displayKaiAds();
    }
  });

});
