import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@fortawesome/fontawesome-free/css/all.css'

import ServiceLocator from "./plugins/service-locator.js";
window.IoC = window.ServiceLocator = ServiceLocator;

Vue.config.productionTip = false

new Vue({
  vuetify,
  data() {
    return {
        theme: {
            dark: true
        }
    };
  },
  render: h => h(App),
  created() {
    // Update theme
    const tempTheme = JSON.parse(window.localStorage.getItem("setting.theme"));
    if (tempTheme) {
      Object.assign(this.theme, tempTheme);
    }

    this.$vuetify.theme.dark = this.theme.dark == true;
    window.IoC.register("theme", this.theme);
  },
  watch: {
    theme: {
      deep: true,
      handler: function (newVal) {
        if (newVal) {
          window.localStorage.setItem("setting.theme", JSON.stringify(newVal));
          this.$vuetify.theme.dark = newVal.dark;
        }
      }
    }
  }
}).$mount('#app')
