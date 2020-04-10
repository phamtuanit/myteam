<template>
    <v-content id="main-layout">
        <LeftDrawer></LeftDrawer>
        <v-container class="pa-0 fill-height" fluid>
            <router-multi-view
                class="multi-view-wrapper"
                tag="div"
            ></router-multi-view>
            <!-- <keep-alive max="10">
                <RouterView :key="$route.name"/>
            </keep-alive> -->
        </v-container>
    </v-content>
</template>

<script>
import LeftDrawer from "../components/left-drawer";
import RouterView from "../components/router-view/multi-router-view.js";
export default {
    components: { LeftDrawer, RouterView },
};
</script>

<style scoped>
#main-layout >>> .v-navigation-drawer .v-navigation-drawer__border {
    background-color: transparent !important;
    width: 0px;
}

.multi-view-wrapper {
    width: 100%;
    max-width: 100%;
    height: 100vh;
}

.multi-view-wrapper > div:not([data-is-active]) {
    display: none !important;
}
</style>
