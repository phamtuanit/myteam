<template>
  <v-app id="app">
    <router-view key="page"></router-view>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data() {
    return {};
  },
  created() {
  },
  methods: {}
};
</script>
<style lang="css">
@import "./assets/common.css";
@import "./assets/color.css";
@import "./assets/spinner.css";
</style>
