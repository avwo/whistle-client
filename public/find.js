;(function() {
  if (window.customElements.get('whistle-electron-find-bar')) {
    return;
  }

  let findBar;
  let finding = false;
  let forward = 0;

  const on = (elem, type, l) => elem.addEventListener(type, l);
  class ElectronFindBar extends HTMLElement {
    constructor() {
      super();
      // mode 有两种模式 open 和 closed，功能是让外部能否访问到自定义元素内部
      var shadow = this.attachShadow( { mode: 'closed' } )
      var con = document.createElement('div');
      con.className = 'electron-find-bar';
      con.innerHTML = `
        <style>
          :host {
            position: fixed;
            top: 0;
            right: 12px;
            display: none;
            z-index: 2147483647;
            font-family: Helvetica Neue,Helvetica,Arial,sans-serif!important;
          }
          .electron-find-bar {
            box-sizing: border-box;
            height: 48px;
            width: 356px;
            border-radius: 5px;
            background-color: #fff;
            box-shadow: 0 5px 15px rgba(0,0,0,.25);
            font-size: 13px;
            padding: 5px 5px 5px 15px;
            white-space: nowrap;
            cursor: default;
            display: flex;
          }
          .electron-find-bar > input, .electron-find-bar span, .electron-find-bar > div {
            display: inline-block;
            line-height: 38px;
            box-sizing: border-box;
            border: none;
            outline: none;
            overflow: hidden;
            vertical-align: middle;
          }
          .electron-find-bar > input {
            flex: 1;
            font-size: 13px;
            color: #202124;
            line-height: 18px;
          }
          .electron-find-bar > span {
            border-right: 1px solid #dadce0;
            color: #606367;
            width: 50px;
            text-align: center;
            overflow: hidden;
          }
          .electron-find-bar > div {
            width: 113px;
          }
          .electron-find-bar > div > span {
            text-align: center;
            color: #ccc;
            cursor: default;
            width: 24px;
            height: 24px;
            border-radius: 24px;
            line-height: 24px;
            box-sizing: border-box;
            margin-left: 9px;
            padding-top: 2px;
          }
          .electron-find-bar > div > span:nth-child(3) {
            line-height: 20px;
            font-size: 20px;
            padding-top: 0;
          }
          .electron-find-bar > div > span.electron-find-active {
            text-align: center;
            color: #000;
          }
          .electron-find-bar > div > span.electron-find-active:hover {
            background-color: #ebebeb;
          }
        </style>
        <input type="password" maxlength="2000" />
          <span class="electron-find-result"></span>
          <div>
            <span class="electron-find-up">
              <svg fill="currentColor" height="12px" width="12px" version="1.1"
                viewBox="0 0 407.436 407.436" xml:space="preserve">
                <polygon points="203.718,91.567 0,294.621 21.179,315.869 203.718,133.924 386.258,315.869 407.436,294.621" />
              </svg>
            </span>
            <span class="electron-find-down">
              <svg fill="currentColor" height="12px" width="12px" version="1.1"
                viewBox="0 0 407.437 407.437" xml:space="preserve">
                <polygon points="386.258,91.567 203.718,273.512 21.179,91.567 0,112.815 203.718,315.87 407.437,112.815" />
              </svg>
            </span>
            <span class="electron-find-close electron-find-active">
              &times;
            </span>
          </div>`;
      this._keyword = '';
      this._container = con;
      this._input = con.querySelector('input');
      this._result = con.querySelector('.electron-find-result');
      this._upBtn = con.querySelector('.electron-find-up');
      this._downBtn = con.querySelector('.electron-find-down');
      this._closeBtn = con.querySelector('.electron-find-close');
      shadow.appendChild(con);
      this.addEvents();
    }
    addEvents() {
      on(this._closeBtn, 'click', hideFindBar);
      const up = this._upBtn;
      const down = this._downBtn;
      const handleUp = () => {
        if (up.classList.contains('electron-find-active')) {
          --forward;
        }
      };
      const handleDown = () => {
        if (down.classList.contains('electron-find-active')) {
          ++forward;
        }
      };
      on(up, 'click', handleUp);
      on(down, 'click', handleDown);
      on(this._input, 'keydown', (e) => {
        if (e.keyCode === 13) {
          finding = true;
          if (e.shiftKey) {
            handleUp();
          } else {
            handleDown();
          }
        }
      });
      on(this._input, 'input', () => {
        const value = this._input.value.trim();
        if (value !== this._keyword) {
          this._keyword = value;
          finding = false;
        }
      });
    }
    lockInput() {
      this._input.type = 'password';
    }
    updateResult(result) {
      this._upBtn.classList.remove('electron-find-active');
      this._downBtn.classList.remove('electron-find-active');
      if (!result) {
        this._result.innerText = '';
        setTimeout(() => {
          this._input.blur();
          this._input.focus();
        }, 30);
        return;
      }
      const index = result.activeMatchOrdinal;
      const count = result.matches;
      this._result.innerText = `${index}/${count}`;
      if (count > 1) {
        this._downBtn.classList.add('electron-find-active');
        this._upBtn.classList.add('electron-find-active');
      }
    }
    focus() {
      this._input.select();
      this._input.focus();
    }
    getValue() {
      return this._input.value.trim();
    }
  }
  
  window.customElements.define('whistle-electron-find-bar', ElectronFindBar);

  function showFindBar() {
    findBar = document.querySelector('whistle-electron-find-bar');
    if (!findBar) {
      findBar = document.createElement('whistle-electron-find-bar');
      document.body.appendChild(findBar);
    }
    findBar.style.display = 'flex';
    findBar.focus();
  }

  function hideFindBar() {
    findBar = document.querySelector('whistle-electron-find-bar');
    if (findBar) {
      findBar.style.display = 'none';
    }
  }

  window[Symbol.for('__Whistle_Electron_Find_Bar__')] = {
    updateResult: function(result) {
      findBar && findBar.updateResult(result);
    },
    getState: function() {
      if (!finding) {
        return;
      }
      const state = {
        forward,
        keyword: findBar ? findBar.getValue() : ''
      };
      forward = 0;
      return state;
    },
    lockInput: function() {
      findBar && findBar.lockInput();
    },
  };

  on(window, 'keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
      showFindBar();
      e.preventDefault();
    } else if (e.keyCode === 27) {
      hideFindBar();
    }
  });
  return true;
})();
