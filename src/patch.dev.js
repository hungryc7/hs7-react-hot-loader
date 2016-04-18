const React = require('react');
const createProxy = require('react-proxy').default;

function setFlag(obj, key) {
  try {
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: false,
      value: true
    });
  } catch (err) {}
}

let proxies = {};
let warnedAboutTypes = {};
function resolveType(type) {
  if (!type || typeof type === 'string') {
    return type;
  }

  if (
    !Object.hasOwnProperty.call(type, '__source') ||
    !type.__source ||
    !type.__source.fileName ||
    !type.__source.localName
  ) {
    setFlag(type, '__noSourceFound');
    return type;
  }

  const source = type.__source;
  const id = source.fileName + '#' + source.localName;

  if (type.hasOwnProperty('__noSourceFound')) {
    if (!warnedAboutTypes[id]) {
      warnedAboutTypes[id] = true;
      console.error(
        `React Hot Loader: ${source.localName} from ${source.fileName} will not ` +
        `hot reload correctly because it contains an imperative call like ` +
        `ReactDOM.render() in the same file. Split ${source.localName} into a ` +
        `separate file for hot reloading to work.`
      );
    }
    return type;
  }

  if (!proxies[id]) {
    proxies[id] = createProxy(type);
  } else if (!type.hasOwnProperty('__hasBeenUsedForProxy')) {
    proxies[id].update(type);
  }
  setFlag(type, '__hasBeenUsedForProxy');

  return proxies[id].get();
}

if (React.createElement.isPatchedByReactHotLoader) {
  throw new Error('Cannot patch React twice.');
}

const createElement = React.createElement;
function patchedCreateElement(type, ...args) {
  return createElement(resolveType(type), ...args);
}
patchedCreateElement.isPatchedByReactHotLoader = true;
React.createElement = patchedCreateElement;
