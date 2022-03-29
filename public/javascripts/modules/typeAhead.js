import axios from 'axios';
import dompurify from 'dompurify';
// this is a function for generating HTML for search results
function searchResultsHTML(employees) {
  return employees.map(employee => {
    return `
      <a href="/employee/${employee.slug}" class="search__result">
        <strong> ${employee.name} </strong>
      </a>
    `;
  }).join('');
}


function typeAhead(search) {
  if(!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');
  
  searchInput.on('input', function() {
    // console.log(this.value);
    if(!this.value) {
      searchResults.style.display = 'none';
      return; // stop
    }
    // show the search result
    searchResults.style.display = 'block';


    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if(res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }
        // no result is found
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for "${this.value}" found!</div>`);

      })
      .catch(err => {
        console.error(err);
      })
  });
  searchInput.on('keyup', (e) => {
    // console.log(e.keyCode);
    // up is 38; down is 40; and enter is 13; these are the keys we need to monitor
    if(![38, 40, 13].includes(e.keyCode)){
      return; // nah
    }
    // we need an active class to mark the selected entry
    // we need to figure out where are we now and if someone presses the desired key where we should go next
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next; 

    if(e.keyCode === 40 && current) {
      next = current.nextElementSibiling || items[0];

    } else if(e.keyCode === 40) {
      next = items[0];
    } else if(e.keyCode === 38 && current) {
      next = current.previousElementSibiling || items[items.length -1];
    } else if(e.keyCode === 38){
      next = items[items.length -1];
    } else if(e.keyCode === 13 && current.href){
      window.location = current.href;
      return;
    }

    if(current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}


export default typeAhead;