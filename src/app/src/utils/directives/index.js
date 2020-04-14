import chatScroll from './v-chat-scroll.js';

export default {
  install: (Vue) => {
    Vue.directive('chat-scroll', chatScroll);
  }
};
