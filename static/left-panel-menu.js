import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue LeftPanel créée");
  },
    data() {
      return {
        // ici on ajoute les variables manipulables du graph
        showMenu1 : true,
        showMenu2 : false,
        showMenu3 : false,
      }
    },
    methods: {
    // fonctions 
    
  },
})