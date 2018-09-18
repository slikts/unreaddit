const request = indexedDB.open(`unreaddit`, 1)
let db = null
const postKey = `post`
const storeName = `comments`
const postId = (() => {
  const parts = window.location.href.split(`/`)
  return parts[parts.indexOf(`comments`) + 1]
})()
const unreadClassname = `__unreaddit_new__`

request.onupgradeneeded = e => {
  db = e.target.result
  const objectStore = db.createObjectStore(storeName, { autoIncrement: true })
  objectStore.createIndex(postKey, postKey, { unique: false })
}

const getStore = callback => {
  const transaction = db.transaction([storeName], `readwrite`)
  if (callback) {
    transaction.oncomplete = callback
  }
  return transaction.objectStore(storeName)
}

const comments = []
const getComments = callback => {
  const objectStore = getStore(callback)
  const index = objectStore.index(postKey)
  const singleKeyRange = IDBKeyRange.only(postId)

  index.openCursor(singleKeyRange).onsuccess = event => {
    const cursor = event.target.result
    if (cursor) {
      comments.push(cursor.value.comment)
      cursor.continue()
    }
  }
}

const addComments = ids => {
  if (!ids.length) {
    return
  }
  const store = getStore(() => {
    console.log(`stored`, ids.length)
  })
  ids.forEach(item => {
    store.add({
      post: postId,
      comment: item,
    })
  })
}

const getVisible = (el, callback) => {
  if (!el) {
    return null
  }
  if (callback) {
    callback(el)
  }
  return el.offsetHeight ? el : getVisible(el.parentNode)
}

const cache = []
const hl = []
const walk = () => {
  const newIds = []
  Array.prototype.forEach.call(document.getElementsByClassName(`thing`), div => {
    if (~cache.indexOf(div)) {
      return
    }
    cache.push(div)
    let id = div.getAttribute(`data-fullname`)
    if (!id) {
      return
    }
    id = id.split(`_`)[1]
    if (id === postId || ~comments.indexOf(id)) {
      return
    }
    hl.push(div)
    div.classList.add(unreadClassname)
    getVisible(div, visible => {
      if (visible.classList.contains(`entry`)) {
        visible.classList.add(`__unreaddit_child_unread__`)
      }
    })
    comments.push(id)
    newIds.push(id)
  })
  addComments(newIds)
}

request.onsuccess = e => {
  db = e.target.result

  getComments(walk)
}

const getOffsetTop = el => {
  if (!el) {
    return null
  }
  return el.offsetTop || getOffsetTop(el.parentNode)
}

document.addEventListener(
  `keydown`,
  e => {
    if (!e.ctrlKey || e.which !== 32) {
      return
    }
    e.preventDefault()

    const totalHeight = window.scrollY + window.innerHeight
    hl.every(div => {
      const offsetTop = getOffsetTop(div)
      if (!offsetTop || offsetTop <= totalHeight) {
        return true
      }
      window.scrollTo(0, offsetTop)
      return false
    })
  },
  true,
)

//    var timeout = null;
//    Array.prototype.forEach.call(document.getElementsByClassName('commentarea'), function(div) {
//        div.addEventListener('DOMSubtreeModified', function() {
//            if (timeout) {
//                clearTimeout(timeout);
//            }
//            timeout = setTimeout(walk, 100);
//        });
//    });

// indexedDB.deleteDatabase('unreaddit');
