import axios from 'axios';
import { $ } from './bling';
function ajaxHeart(e) {
  e.preventDefault();
  axios
    .post(this.action)
    .then(res => {
      // button.heart__button(type="submit" name="heart" class=heartClass) - accessed by this.heart(name attribute)
      this.heart.classList.toggle('heart__button--hearted');
      $('.heart-count').textContent = res.data.hearts.length;
    })
    .catch(err =>  console.error(err));
}

export default ajaxHeart;