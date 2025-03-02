### DOM Inspection : Getting unique Classes and IDs

There may be instances perhaps we're looking at coverage and cleaning up unnecessary CSS, to comb through and the DOM and see what types of elements are actively loaded. Whatever your case is here are some ways we can parse the currently loaded page. 

To identify all unique IDs used in the current document DOM, here’s the ES6+ code for extracting unique id values:

```javascript
// Function to find all unique IDs in the document
const uniqueIds = unique(
  [...document.querySelectorAll('*')] // Get all elements
    .map(elt => elt.id)               // Map to their id
    .filter(id => id)                 // Filter out empty strings
);

console.log(uniqueIds);
```


Explanation:
```document.querySelectorAll('*')```: Selects all elements in the DOM.


```.map(elt => elt.id)```: Extracts the id attribute from each element.


```.filter(id => id)```: Filters out falsy values (e.g., empty strings).


```unique()```: Uses your unique() function to ensure the list contains only unique IDs.



If you want both the unique class and id extraction in one place, here’s a combined version:

```javascript
// Utility function to get unique items in an array
const unique = arr => [...new Set(arr)];

// Find all unique classes
const uniqueClasses = unique(
  [].concat(
    ...[...document.querySelectorAll('*')]
      .map(elt => [...elt.classList])
  )
);

// Find all unique IDs
const uniqueIds = unique(
  [...document.querySelectorAll('*')]
    .map(elt => elt.id)
    .filter(id => id)
);

console.log('Unique Classes:', uniqueClasses);
console.log('Unique IDs:', uniqueIds);
```


This will output both unique classes and IDs found in the current document's DOM.


To get a list of all unique element tags (like div, span, a, etc.) in the document's DOM, you can use a similar approach. JavaScript Code to Find All Unique Elements:
```javascript
// Utility function to get unique items in an array
const unique = arr => [...new Set(arr)];

// Find all unique element tags
const uniqueElements = unique(
  [...document.querySelectorAll('*')] // Get all elements
    .map(elt => elt.tagName.toLowerCase()) // Map to tag names (lowercase for consistency)
);

console.log('Unique Elements:', uniqueElements);
```

Explanation:
```document.querySelectorAll('*')```: Selects all elements in the DOM.


```.map(elt => elt.tagName.toLowerCase())```: Extracts each element's tag name (converted to lowercase for consistency).

```unique()```: Ensures the list contains only unique tag names.


Combined Code for Classes, IDs, and Elements. If you want to extract unique classes, IDs, and element tags in one go, here's the complete code:

```javascript
// Utility function to get unique items in an array
const unique = arr => [...new Set(arr)];

// Find all unique classes
const uniqueClasses = unique(
  [].concat(
    ...[...document.querySelectorAll('*')]
      .map(elt => [...elt.classList])
  )
);

// Find all unique IDs
const uniqueIds = unique(
  [...document.querySelectorAll('*')]
    .map(elt => elt.id)
    .filter(id => id)
);

// Find all unique element tags
const uniqueElements = unique(
  [...document.querySelectorAll('*')]
    .map(elt => elt.tagName.toLowerCase())
);

console.log('Unique Classes:', uniqueClasses);
console.log('Unique IDs:', uniqueIds);
console.log('Unique Elements:', uniqueElements);
```


So for a document like this,

```html
<div id="main" class="container">
  <span class="highlight">Text</span>
  <p id="paragraph1" class="text">Paragraph</p>
</div>
```


The output would be:

```js
Unique Classes: ['container', 'highlight', 'text']
Unique IDs: ['main', 'paragraph1']
Unique Elements: ['div', 'span', 'p']
```
