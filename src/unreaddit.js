'use strict';

var request = indexedDB.open('unreaddit', 1);
var db = null;
var postKey = 'post';
var storeName = 'comments';
var postId = (function() {
    return 123;
    var parts = window.location.href;
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

function walk() {
    var newIds = [];
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
        if (~comments.indexOf(id)) {
            return;
        }
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

//indexedDB.deleteDatabase('unreaddit');
