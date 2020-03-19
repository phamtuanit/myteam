<template>
  <v-app id="app">
    <router-view key="page"></router-view>
  </v-app>
</template>

<script>
export default {
  name: "App",
  provide() {
    const auth = window.IoC.get("auth");
    return { theme: this.theme, auth };
  },
  data() {
    return {};
  },
  created() {
    window.IoC.register("app", this);
  },
  methods: {}
};
</script>
<style lang="css">
@import "./assets/common.css";
@import "./assets/color.css";
@import "./assets/spinner.css";
</style>
