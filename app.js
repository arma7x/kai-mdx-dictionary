const APP_VERSION = "1.1.0";

const pushLocalNotification = function(text) {
  window.Notification.requestPermission().then(function(result) {
    var notification = new window.Notification(text);
      notification.onclick = function(event) {
        if (window.navigator.mozApps) {
          var request = window.navigator.mozApps.getSelf();
          request.onsuccess = function() {
            if (request.result) {
              notification.close();
              request.result.launch();
            }
          };
        } else {
          window.open(document.location.origin, '_blank');
        }
      }
      notification.onshow = function() {
        notification.close();
      }
  });
}

window.addEventListener("load", function() {

  localforage.setDriver(localforage.LOCALSTORAGE);

  function isElementInViewport(el, marginTop = 0, marginBottom = 0) {
    if (!el.getBoundingClientRect)
      return
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 + marginTop &&
        rect.left >= 0 &&
        rect.bottom <= ((window.innerHeight || document.documentElement.clientHeight) - marginBottom) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
  }

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

  const viewDefinition = function($router, name, definition, style, mdict) {
    var ANCHORS = [];
    var PARENT;
    var _anchorIndex = -1
    $router.push(
      new Kai({
        name: 'viewDefinition',
        data: {
          title: 'viewDefinition',
          
        },
        template: `<div  id="__viewDefinition__" class="kui-flex-wrap" style="font-size:100%">
          <style scoped>${style}</style>
          <style scoped>a.focus{color:white!important;background-color:#320374!important;padding:0px 2px;border-radius:3px;}</style>
          <span class="kai-padding-5">${definition}</span>
        </div>`,
        mounted: function() {
          if (navigator.userAgent !== 'Mozilla/5.0 (Mobile; rv:48.0) Gecko/48.0 Firefox/48.0') {
            document.getElementById('app').requestFullscreen();
            document.getElementById('app').style.backgroundColor = '#fff';
          }
          this.$router.setHeaderTitle(name);
          const firstP = document.querySelector('p');
          if (firstP.innerHTML.indexOf('entry') > -1) {
            firstP.innerHTML = '';
          }
          const VD = document.getElementById('__viewDefinition__');
          const imgs = VD.querySelectorAll('img');
          const regSrc = new RegExp(/(data:image\/[^;]+;base64[^"]+)/);
          for (var img in imgs) {
            const current = imgs[img];
            if (current.src && !regSrc.test(current.src)) {
              current.style.visibility = 'hidden';
              current.style.width = '0px';
              current.style.height = '0px';
            }
          }
          const len = ANCHORS.length;
          ANCHORS = [];
          var done = false, idx = 0;
          PARENT = window.getComputedStyle(document.getElementById('__kai_router__'));
          const _anchors = VD.querySelectorAll('a')
          for (var x in _anchors) {
            if (_anchors[x].innerHTML !== "" && _anchors[x].innerHTML != null) {
              ANCHORS.push(_anchors[x]);
              if (!done) {
                if (len === 0 && isElementInViewport(_anchors[x], parseFloat(PARENT.marginTop), parseFloat(PARENT.marginBottom))) {
                  _anchors[x].classList.add('focus');
                  done = true;
                  _anchorIndex = idx;
                }
              }
              idx++;
            }
          }
          ANCHORS[_anchorIndex].classList.add('focus');
          this.methods.getVisibleAnchor();
        },
        unmounted: function() {
        },
        methods: {
          isAnchorInViewPort: function(index) {
            if (isElementInViewport(ANCHORS[index], parseFloat(PARENT.marginTop), parseFloat(PARENT.marginBottom))) {
              return true;
            }
            return false;
          },
          getVisibleAnchor: function() {
            const val = _anchorIndex === -1 ? -1 : 1;
            if (((_anchorIndex === -1) || (_anchorIndex === ANCHORS.length)) && !this.methods.isAnchorInViewPort(_anchorIndex - val)) {
              for (var x in ANCHORS) {
                if (this.methods.isAnchorInViewPort(x)) {
                  _anchorIndex = parseInt(x);
                  break;
                }
              }
            }
            this.methods.renderCenterText();
          },
          renderCenterText: function() {
            if (ANCHORS[_anchorIndex]) {
              const words = ANCHORS[_anchorIndex].innerText.trim().split(" ");
              if (words.length > 1) {
                this.$router.setSoftKeyCenterText("SELECT");
              } else {
                this.$router.setSoftKeyCenterText("GOTO");
              }
            } else {
              this.$router.setSoftKeyCenterText("");
            }
          },
          viewDefinition: function(word) {
            $router.showLoading();
            mdict.lookup(word)
            .then((content) => {
              if (DOMPurify) {
                content = DOMPurify.sanitize(content)
              }
              viewDefinition($router, name, content, style, mdict);
            })
            .catch((err = 'Error') => {
              $router.showToast(err.toString());
            })
            .finally(() => {
              $router.hideLoading();
            })
          }
        },
        softKeyText: { left: '-', center: '', right: '+' }, //SELECT
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
            if (ANCHORS[_anchorIndex]) {
              const words = ANCHORS[_anchorIndex].innerText.trim().split(" ");
              if (words.length > 1) {
                var menu = [];
                for (var x in words) {
                  if (words[x].trim) {
                    if (words[x].trim().length > 0)
                      menu.push({'text': words[x]});
                  }
                }
                $router.showOptionMenu('GOTO', menu, 'SELECT', (selected) => {
                  setTimeout(() => {
                    this.methods.viewDefinition(selected.text);
                  });
                }, (selected) => {
                  this.methods.renderCenterText();
                });
              } else {
                this.methods.viewDefinition(words[0]);
              }
            }
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
        },
        dPadNavListener: {
          arrowUp: function() {
            const DOM = document.getElementById(this.id);
            DOM.scrollTop -= 20;
            this.scrollThreshold = DOM.scrollTop;
            if (ANCHORS[_anchorIndex]) {
              ANCHORS[_anchorIndex].classList.remove('focus');
              while (!this.methods.isAnchorInViewPort(_anchorIndex))  {
                _anchorIndex -= 1;
                if (ANCHORS[_anchorIndex] == null)
                  break
              }
            }
            if (ANCHORS[_anchorIndex])
              ANCHORS[_anchorIndex].classList.add('focus');
            this.methods.getVisibleAnchor();
          },
          arrowRight: function() {
            if (ANCHORS[_anchorIndex + 1] == null)
              return
            if (this.methods.isAnchorInViewPort(_anchorIndex + 1)) {
              ANCHORS[_anchorIndex].classList.remove('focus');
              ANCHORS[_anchorIndex + 1].classList.add('focus');
              _anchorIndex += 1;
            }
            this.methods.renderCenterText();
          },
          arrowDown: function() {
            const DOM = document.getElementById(this.id);
            DOM.scrollTop += 20;
            this.scrollThreshold = DOM.scrollTop;
            if (ANCHORS[_anchorIndex]) {
              ANCHORS[_anchorIndex].classList.remove('focus');
              while (!this.methods.isAnchorInViewPort(_anchorIndex))  {
                _anchorIndex += 1;
                if (ANCHORS[_anchorIndex] == null)
                  break
              }
            }
            if (ANCHORS[_anchorIndex])
              ANCHORS[_anchorIndex].classList.add('focus');
            this.methods.getVisibleAnchor();
          },
          arrowLeft: function() {
            if (ANCHORS[_anchorIndex - 1] == null)
              return
            if (this.methods.isAnchorInViewPort(_anchorIndex - 1)) {
              ANCHORS[_anchorIndex].classList.remove('focus');
              ANCHORS[_anchorIndex - 1].classList.add('focus');
              _anchorIndex -= 1;
            }
            this.methods.renderCenterText();
          },
        }
      })
    );
  }

  const loadMDX = function($router, file, style) {
    const paths = file.name.split('/');
    const names = paths[paths.length - 1].split('.');
    const name = names[0];
    require(['mdict-common', 'mdict-parser', 'mdict-renderer'], function(MCommon, MParser, MRenderer) {
      $router.showLoading();
      const timer = setTimeout(() => {
        pushLocalNotification('Please reopen the app');
        window.close();
      }, 5000);
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
              $router.setHeaderTitle(name);
              this.methods.renderSoftKey();
              if (navigator.userAgent !== 'Mozilla/5.0 (Mobile; rv:48.0) Gecko/48.0 Firefox/48.0') {
                document.getElementById('app').style.backgroundColor = '';
                document.exitFullscreen();
              }
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
                      content = DOMPurify.sanitize(content) //todo
                    }
                    viewDefinition($router, name, content, style, mdict);
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
      })
      .finally(() => {
        clearTimeout(timer);
        $router.hideLoading();
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
      this.$router.setHeaderTitle('Load MDX');
      localforage.getItem('APP_VERSION')
      .then((v) => {
        if (v == null || v != APP_VERSION) {
          this.$router.showToast(`Add shortcut key for navigation`);
          this.$router.push('helpSupportPage');
          localforage.setItem('APP_VERSION', APP_VERSION)
        } else {
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
        const timer = setTimeout(() => {
          pushLocalNotification('Please reopen the app');
          window.close();
        }, 5000);
        DS.getFile(path, (mdxBlob) => {
          this.$router.hideLoading();
          loadMDX(this.$router, mdxBlob, style);
          clearTimeout(timer);
        }, (err) => {
          this.$router.hideLoading();
          this.$router.showToast(err.toString());
          clearTimeout(timer);
        })
      },
      renderSoftKey: function() {
        const current = this.$router.stack[this.$router.stack.length - 1];
        if (current.name !== 'home')
          return
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
                          this.methods.renderSoftKey();
                        }, 100);
                      }
                      break
                    case 'SoftRight':
                      this.$router.hideBottomSheet();
                      setTimeout(() => {
                        SEARCH_INPUT.blur();
                        this.methods.search(SEARCH_INPUT.value);
                        this.methods.renderSoftKey();
                      }, 100);
                      break
                    case 'SoftLeft':
                      this.$router.hideBottomSheet();
                      setTimeout(() => {
                        SEARCH_INPUT.blur();
                        this.methods.renderSoftKey();
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
        }, () => {
          setTimeout(this.methods.renderSoftKey, 100);
        });
      },
      center: function() {
        var selected = this.data.mdxs[this.verticalNavIndex];
        if (selected) {
          var DS;
          if (window['__DS__'])
            DS = window['__DS__'];
          else
            DS = new DataStorage();
          this.$router.showLoading();
          const timer = setTimeout(() => {
            pushLocalNotification('Please reopen the app');
            window.close();
          }, 5000);
          DS.getFile(selected.path.replace(new RegExp('.mdx$'), '.css'), (styleBlob) => {
            var reader = new FileReader();
            reader.readAsText(styleBlob);
            reader.onload = () => {
              clearTimeout(timer);
              this.$router.hideLoading();
              this.methods.openMdx(DS, selected.path, reader.result);
            }
            reader.onerror = () => {
              clearTimeout(timer);
              this.$router.hideLoading();
              this.methods.openMdx(DS, selected.path, '');
            }
          }, (err) => {
            clearTimeout(timer);
            this.$router.hideLoading();
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
