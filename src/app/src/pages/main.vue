<template>
    <v-content id="main-layout">
        <LeftDrawer></LeftDrawer>
        <RouterView :key="$route.name" />
    </v-content>
</template>

<script>
import LeftDrawer from "../components/left-drawer";
import RouterView from "../components/router-view/keep-alive-view.vue";
export default {
    components: { LeftDrawer, RouterView },
};
</script>

<style scoped>
#main-layout >>> .v-navigation-drawer .v-navigation-drawer__border {
    background-color: transparent !important;
    width: 0px;
}
</style>
