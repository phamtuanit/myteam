<template>
  <v-container class="fill-height" fluid id="login-screen">
    <div align="center" justify="center" class="mx-auto">
      <v-card :loading="loading" max-width="400" light class="pb-2">
        <v-img height="200" src="@/assets/images/mountain.jpg">
          <v-container class="fill-height ml-2">
            <v-row
              align="center"
              justify="center"
              class="mx-0 my-auto white--text"
            >
              <v-img
                max-width="84"
                aspect-ratio="0.9"
                src="@/assets/logo/v-logo_dark_84.png"
              ></v-img>
            </v-row>
          </v-container>
        </v-img>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="userName"
              label="Login"
              name="username"
              prepend-icon="mdi-account"
              type="text"
              class="pt-1"
            />

            <v-text-field
              v-model="password"
              id="password"
              label="Password"
              name="password"
              prepend-icon="mdi-lock"
              type="password"
              @keyup.enter="login"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pt-0">
          <v-spacer />
          <v-btn text @click="login" :disabled="loading" class="btn-login"
            >Login</v-btn
          >
        </v-card-actions>
      </v-card>
    </div>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      userName: null,
      password: null
    };
  },
  created() {
    this.auth = window.IoC.get("auth");
  },
  methods: {
    login() {
      this.loading = true;
      this.auth
        .login(this.userName, this.password)
        .then(() => {
          const route = this.$route;
          const nextRoute = route.query["next-to"] || "root";
          delete route.query["next-to"];
          console.info("Redirect to:", nextRoute);
          this.$router
            .push({ name: nextRoute, query: route.query })
            .catch(console.error);
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style scoped>
#login-screen {
  background-color: var(--primary-color);
}

#login-screen >>> .btn-login {
  color: var(--primary-color);
}
</style>
