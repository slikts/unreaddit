'use strict';

var request = indexedDB.open('unreaddit', 1);
var db = null;
var postKey = 'post';
var storeName = 'comments';
var postId = (function() {
    var parts = window.location.href.split('/');
    return parts[parts.indexOf('comments') + 1];
})();

request.onupgradeneeded = function(e) {
    db = e.target.result;
    var objectStore = db.createObjectStore(storeName, {autoIncrement: true});
    objectStore.createIndex(postKey, postKey, {unique: false});
};

function getStore(callback) {
    var transaction = db.transaction([storeName], 'readwrite');
    if (callback) {
        transaction.oncomplete = callback;
    }
    return transaction.objectStore(storeName);
}

var comments = [];
function getComments(callback) {
    var objectStore = getStore(callback);
    var index = objectStore.index(postKey);
    var singleKeyRange = IDBKeyRange.only(postId);

    index.openCursor(singleKeyRange).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            comments.push(cursor.value.comment);
            cursor.continue();
        }
    };
}

function addComments(ids) {
    if (!ids.length) {
        return;
    }
    var store = getStore(function() {
        console.log('stored', ids.length);
    });
    ids.forEach(
            function(item) {
                store.add({
                    post: postId,
                    comment: item
                });
            }
    );
}

var cache = [];
var hl = [];
function walk() {
    var newIds = [];
//    console.log('walk', comments, cache);
    Array.prototype.forEach.call(document.getElementsByClassName('thing'), function(div) {
        if (~cache.indexOf(div)) {
            return;
        }
        cache.push(div);
        var id = div.getAttribute('data-fullname');
        if (!id) {
            return;
        }
        id = id.split('_')[1];
        if (id === postId || ~comments.indexOf(id)) {
            return;
        }
        hl.push(div);
        div.classList.add('__unreaddit_new__');
        comments.push(id);
        newIds.push(id);
    });
    addComments(newIds);
}

request.onsuccess = function(e) {
    db = e.target.result;

    getComments(walk);
};

function getOffsetTop(el) {
    if (!el) {
        return null;
    }
    return el.offsetTop || getOffsetTop(el.parentNode);
}

document.addEventListener('keydown', function(e) {
    if (!e.ctrlKey || e.which !== 32) {
        return;
    }
    e.preventDefault();

    var totalHeight = scrollY + innerHeight;
    hl.every(function(div) {
        var offsetTop = getOffsetTop(div);
        if (!offsetTop || offsetTop <= totalHeight) {
            return true;
        }
        scrollTo(0, offsetTop);
        return false;
    });
}, true);

//    var timeout = null;
//    Array.prototype.forEach.call(document.getElementsByClassName('commentarea'), function(div) {
//        div.addEventListener('DOMSubtreeModified', function() {
//            if (timeout) {
//                clearTimeout(timeout);
//            }
//            timeout = setTimeout(walk, 100);
//        });
//    });

//indexedDB.deleteDatabase('unreaddit');
