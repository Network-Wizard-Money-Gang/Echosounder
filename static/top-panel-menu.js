import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue TopPanel créée");
  },
    data() {
      return {
          // visibilité du menu de configuration
        menuConf : false,
        // onglets du menu de configuration
        menuConfState : true,
        menuConfNetwork : false,
        menuConfTheme : false,
        // objet contenant l'état du système
        health : {},
      }
    },
    methods: {
        // fonctions 
        addOrUpdateHealtValue : function(valuekey) {
            this.health[valuekey[0]] = valuekey[1];
            this.$forceUpdate();
            console.log(this.health);
        },
    },
})