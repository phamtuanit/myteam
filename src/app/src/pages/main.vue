<template>
    <v-content id="main-layout">
        <LeftDrawer></LeftDrawer>
        <v-container class="pa-0 fill-height" fluid>
            <router-view key="app-content"></router-view>
        </v-container>
    </v-content>
</template>

<script>
import LeftDrawer from "../components/left-drawer";
export default {
    components: { LeftDrawer },
    created() {},
};
</script>

<style scoped>
#main-layout >>> .v-navigation-drawer .v-navigation-drawer__border {
    background-color: transparent !important;
    width: 0px;
}
</style>
