<template>
  <v-container
    class="fill-height bg-1"
    fluid
    id="preparation-screen"
  >
    <div
      align="center"
      justify="center"
      class="mx-auto"
    >
      <div class="cssload-dots">
        <div class="cssload-dot"></div>
        <div class="cssload-dot"></div>
        <div class="cssload-dot"></div>
        <div class="cssload-dot"></div>
        <div class="cssload-dot"></div>
      </div>

      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation="12"
            ></feGaussianBlur>
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0	0 1 0 0 0	0 0 1 0 0	0 0 0 18 -7"
              result="goo"
            ></feColorMatrix>
          </filter>
        </defs>
      </svg>
    </div>
  </v-container>
</template>

<script>
export default {
    created() {
        this.isInitialized = false;

        // Preparation effect
        this.timmer = setTimeout(() => {
            clearTimeout(this.timmer);
            this.timmer = null;

            if (this.isInitialized == true) {
                // In case preparation is finieshed
                this.redirectToExpectation();
            }
        }, 0 * 1000);

        this.initialize();
    },
    mounted() {},
    destroyed() {
        clearTimeout(this.timmer);
    },
    methods: {
        initialize() {
            const store = this.$store;
            store
                .dispatch("initialize")
                .then(() => {
                    const nextState = store.getters.appState;
                    switch (nextState) {
                        case "authentication":
                            {
                                // When previous state is done "startup"
                                const theme = window.IoC.get("theme");
                                this.$vuetify.theme.dark = theme.dark;
                            }
                            break;

                        default:
                            break;
                    }

                    this.isInitialized = store.getters.initialized;
                    if (this.isInitialized == true) {
                        // Incase preparation is just finished before timmer is done
                        if (this.timmer == null) {
                            this.redirectToExpectation();
                        }
                    } else {
                        // Continue preparation
                        this.initialize();
                    }
                })
                .catch(err => {
                    const currentState = store.getters.appState;
                    console.error(
                        "Got an error while initializing.",
                        currentState,
                        err
                    );
                    switch (currentState) {
                        case "authentication":
                            // Incase could not authenticate
                            if (err.message == "Network Error") {
                                this.redirect({ name: "system-error" });
                                return;
                            }
                            this.redirect({ name: "login" });
                            break;

                        default:
                            // Other error while preparating
                            this.redirect({ name: "system-error" });
                            break;
                    }
                });
        },
        redirect(nextRoute) {
            const route = this.$route;
            nextRoute.query = route.query;
            this.$router.push(nextRoute);
        },
        redirectToExpectation() {
            // Redirect to given route or main page
            const route = this.$route;
            let nextRoute = route.query["next-to"] || "app";
            delete route.query["next-to"];
            if (nextRoute == "login") {
                nextRoute = "app";
            }
            this.$router.push({ name: nextRoute, query: route.query });
        },
    },
};
</script>

<style scoped>
</style>

<style>
/* spinner https://icons8.com/cssload/en/spinners*/
.cssload-dots {
    width: 0;
    height: 0;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
    outline: 1px solid red;
    filter: url(#goo);
    -o-filter: url(#goo);
    -ms-filter: url(#goo);
    -webkit-filter: url(#goo);
    -moz-filter: url(#goo);
}

.cssload-dot {
    width: 0;
    height: 0;
    position: absolute;
    left: 0;
    top: 0;
}
.cssload-dot:before {
    content: "";
    width: 34px;
    height: 34px;
    border-radius: 49px;
    background: rgb(251, 211, 1);
    position: absolute;
    left: 50%;
    transform: translateY(0);
    -o-transform: translateY(0);
    -ms-transform: translateY(0);
    -webkit-transform: translateY(0);
    -moz-transform: translateY(0);
    margin-left: -17.5px;
    margin-top: -17.5px;
}

.cssload-dot:nth-child(5):before {
    z-index: 100;
    width: 44.5px;
    height: 44.5px;
    margin-left: -21.75px;
    margin-top: -21.75px;
    animation: cssload-dot-colors 4.6s ease infinite;
    -o-animation: cssload-dot-colors 4.6s ease infinite;
    -ms-animation: cssload-dot-colors 4.6s ease infinite;
    -webkit-animation: cssload-dot-colors 4.6s ease infinite;
    -moz-animation: cssload-dot-colors 4.6s ease infinite;
}

.cssload-dot:nth-child(1) {
    animation: cssload-dot-rotate-1 4.6s 0s linear infinite;
    -o-animation: cssload-dot-rotate-1 4.6s 0s linear infinite;
    -ms-animation: cssload-dot-rotate-1 4.6s 0s linear infinite;
    -webkit-animation: cssload-dot-rotate-1 4.6s 0s linear infinite;
    -moz-animation: cssload-dot-rotate-1 4.6s 0s linear infinite;
}
.cssload-dot:nth-child(1):before {
    background-color: rgb(255, 50, 112);
    animation: cssload-dot-move 4.6s 0s ease infinite;
    -o-animation: cssload-dot-move 4.6s 0s ease infinite;
    -ms-animation: cssload-dot-move 4.6s 0s ease infinite;
    -webkit-animation: cssload-dot-move 4.6s 0s ease infinite;
    -moz-animation: cssload-dot-move 4.6s 0s ease infinite;
}

.cssload-dot:nth-child(2) {
    animation: cssload-dot-rotate-2 4.6s 1.15s linear infinite;
    -o-animation: cssload-dot-rotate-2 4.6s 1.15s linear infinite;
    -ms-animation: cssload-dot-rotate-2 4.6s 1.15s linear infinite;
    -webkit-animation: cssload-dot-rotate-2 4.6s 1.15s linear infinite;
    -moz-animation: cssload-dot-rotate-2 4.6s 1.15s linear infinite;
}
.cssload-dot:nth-child(2):before {
    background-color: rgb(32, 139, 241);
    animation: cssload-dot-move 4.6s 1.15s ease infinite;
    -o-animation: cssload-dot-move 4.6s 1.15s ease infinite;
    -ms-animation: cssload-dot-move 4.6s 1.15s ease infinite;
    -webkit-animation: cssload-dot-move 4.6s 1.15s ease infinite;
    -moz-animation: cssload-dot-move 4.6s 1.15s ease infinite;
}

.cssload-dot:nth-child(3) {
    animation: cssload-dot-rotate-3 4.6s 2.3s linear infinite;
    -o-animation: cssload-dot-rotate-3 4.6s 2.3s linear infinite;
    -ms-animation: cssload-dot-rotate-3 4.6s 2.3s linear infinite;
    -webkit-animation: cssload-dot-rotate-3 4.6s 2.3s linear infinite;
    -moz-animation: cssload-dot-rotate-3 4.6s 2.3s linear infinite;
}
.cssload-dot:nth-child(3):before {
    background-color: rgb(175, 225, 2);
    animation: cssload-dot-move 4.6s 2.3s ease infinite;
    -o-animation: cssload-dot-move 4.6s 2.3s ease infinite;
    -ms-animation: cssload-dot-move 4.6s 2.3s ease infinite;
    -webkit-animation: cssload-dot-move 4.6s 2.3s ease infinite;
    -moz-animation: cssload-dot-move 4.6s 2.3s ease infinite;
}

.cssload-dot:nth-child(4) {
    animation: cssload-dot-rotate-4 4.6s 3.45s linear infinite;
    -o-animation: cssload-dot-rotate-4 4.6s 3.45s linear infinite;
    -ms-animation: cssload-dot-rotate-4 4.6s 3.45s linear infinite;
    -webkit-animation: cssload-dot-rotate-4 4.6s 3.45s linear infinite;
    -moz-animation: cssload-dot-rotate-4 4.6s 3.45s linear infinite;
}
.cssload-dot:nth-child(4):before {
    background-color: rgb(251, 211, 1);
    animation: cssload-dot-move 4.6s 3.45s ease infinite;
    -o-animation: cssload-dot-move 4.6s 3.45s ease infinite;
    -ms-animation: cssload-dot-move 4.6s 3.45s ease infinite;
    -webkit-animation: cssload-dot-move 4.6s 3.45s ease infinite;
    -moz-animation: cssload-dot-move 4.6s 3.45s ease infinite;
}

@keyframes cssload-dot-move {
    0% {
        transform: translateY(0);
    }
    18%,
    22% {
        transform: translateY(-68px);
    }
    40%,
    100% {
        transform: translateY(0);
    }
}

@-o-keyframes cssload-dot-move {
    0% {
        -o-transform: translateY(0);
    }
    18%,
    22% {
        -o-transform: translateY(-68px);
    }
    40%,
    100% {
        -o-transform: translateY(0);
    }
}

@-ms-keyframes cssload-dot-move {
    0% {
        -ms-transform: translateY(0);
    }
    18%,
    22% {
        -ms-transform: translateY(-68px);
    }
    40%,
    100% {
        -ms-transform: translateY(0);
    }
}

@-webkit-keyframes cssload-dot-move {
    0% {
        -webkit-transform: translateY(0);
    }
    18%,
    22% {
        -webkit-transform: translateY(-68px);
    }
    40%,
    100% {
        -webkit-transform: translateY(0);
    }
}

@-moz-keyframes cssload-dot-move {
    0% {
        -moz-transform: translateY(0);
    }
    18%,
    22% {
        -moz-transform: translateY(-68px);
    }
    40%,
    100% {
        -moz-transform: translateY(0);
    }
}

@keyframes cssload-dot-colors {
    0% {
        background-color: rgb(251, 211, 1);
    }
    25% {
        background-color: rgb(255, 50, 112);
    }
    50% {
        background-color: rgb(32, 139, 241);
    }
    75% {
        background-color: rgb(175, 225, 2);
    }
    100% {
        background-color: rgb(251, 211, 1);
    }
}

@-o-keyframes cssload-dot-colors {
    0% {
        background-color: rgb(251, 211, 1);
    }
    25% {
        background-color: rgb(255, 50, 112);
    }
    50% {
        background-color: rgb(32, 139, 241);
    }
    75% {
        background-color: rgb(175, 225, 2);
    }
    100% {
        background-color: rgb(251, 211, 1);
    }
}

@-ms-keyframes cssload-dot-colors {
    0% {
        background-color: rgb(251, 211, 1);
    }
    25% {
        background-color: rgb(255, 50, 112);
    }
    50% {
        background-color: rgb(32, 139, 241);
    }
    75% {
        background-color: rgb(175, 225, 2);
    }
    100% {
        background-color: rgb(251, 211, 1);
    }
}

@-webkit-keyframes cssload-dot-colors {
    0% {
        background-color: rgb(251, 211, 1);
    }
    25% {
        background-color: rgb(255, 50, 112);
    }
    50% {
        background-color: rgb(32, 139, 241);
    }
    75% {
        background-color: rgb(175, 225, 2);
    }
    100% {
        background-color: rgb(251, 211, 1);
    }
}

@-moz-keyframes cssload-dot-colors {
    0% {
        background-color: rgb(251, 211, 1);
    }
    25% {
        background-color: rgb(255, 50, 112);
    }
    50% {
        background-color: rgb(32, 139, 241);
    }
    75% {
        background-color: rgb(175, 225, 2);
    }
    100% {
        background-color: rgb(251, 211, 1);
    }
}

@keyframes cssload-dot-rotate-1 {
    0% {
        transform: rotate(-105deg);
    }
    100% {
        transform: rotate(270deg);
    }
}

@-o-keyframes cssload-dot-rotate-1 {
    0% {
        -o-transform: rotate(-105deg);
    }
    100% {
        -o-transform: rotate(270deg);
    }
}

@-ms-keyframes cssload-dot-rotate-1 {
    0% {
        -ms-transform: rotate(-105deg);
    }
    100% {
        -ms-transform: rotate(270deg);
    }
}

@-webkit-keyframes cssload-dot-rotate-1 {
    0% {
        -webkit-transform: rotate(-105deg);
    }
    100% {
        -webkit-transform: rotate(270deg);
    }
}

@-moz-keyframes cssload-dot-rotate-1 {
    0% {
        -moz-transform: rotate(-105deg);
    }
    100% {
        -moz-transform: rotate(270deg);
    }
}

@keyframes cssload-dot-rotate-2 {
    0% {
        transform: rotate(165deg);
    }
    100% {
        transform: rotate(540deg);
    }
}

@-o-keyframes cssload-dot-rotate-2 {
    0% {
        -o-transform: rotate(165deg);
    }
    100% {
        -o-transform: rotate(540deg);
    }
}

@-ms-keyframes cssload-dot-rotate-2 {
    0% {
        -ms-transform: rotate(165deg);
    }
    100% {
        -ms-transform: rotate(540deg);
    }
}

@-webkit-keyframes cssload-dot-rotate-2 {
    0% {
        -webkit-transform: rotate(165deg);
    }
    100% {
        -webkit-transform: rotate(540deg);
    }
}

@-moz-keyframes cssload-dot-rotate-2 {
    0% {
        -moz-transform: rotate(165deg);
    }
    100% {
        -moz-transform: rotate(540deg);
    }
}

@keyframes cssload-dot-rotate-3 {
    0% {
        transform: rotate(435deg);
    }
    100% {
        transform: rotate(810deg);
    }
}

@-o-keyframes cssload-dot-rotate-3 {
    0% {
        -o-transform: rotate(435deg);
    }
    100% {
        -o-transform: rotate(810deg);
    }
}

@-ms-keyframes cssload-dot-rotate-3 {
    0% {
        -ms-transform: rotate(435deg);
    }
    100% {
        -ms-transform: rotate(810deg);
    }
}

@-webkit-keyframes cssload-dot-rotate-3 {
    0% {
        -webkit-transform: rotate(435deg);
    }
    100% {
        -webkit-transform: rotate(810deg);
    }
}

@-moz-keyframes cssload-dot-rotate-3 {
    0% {
        -moz-transform: rotate(435deg);
    }
    100% {
        -moz-transform: rotate(810deg);
    }
}

@keyframes cssload-dot-rotate-4 {
    0% {
        transform: rotate(705deg);
    }
    100% {
        transform: rotate(1080deg);
    }
}

@-o-keyframes cssload-dot-rotate-4 {
    0% {
        -o-transform: rotate(705deg);
    }
    100% {
        -o-transform: rotate(1080deg);
    }
}

@-ms-keyframes cssload-dot-rotate-4 {
    0% {
        -ms-transform: rotate(705deg);
    }
    100% {
        -ms-transform: rotate(1080deg);
    }
}

@-webkit-keyframes cssload-dot-rotate-4 {
    0% {
        -webkit-transform: rotate(705deg);
    }
    100% {
        -webkit-transform: rotate(1080deg);
    }
}

@-moz-keyframes cssload-dot-rotate-4 {
    0% {
        -moz-transform: rotate(705deg);
    }
    100% {
        -moz-transform: rotate(1080deg);
    }
}
</style>
