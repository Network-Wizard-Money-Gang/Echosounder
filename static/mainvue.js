// axios lib loaded before 
const { createApp } = Vue;

const app = Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph lorsque l'app se crée
    //this.CreateCytoGraph();
    //console.log(this);
    this.getHealth();
  },
	data() {
	  return {
        // ici on ajoute les variables manipulables de la page
        health: {},
        address_family: {},
        interfaces : {},
        cyto : {},
	  }
	},
	methods: {
    // fonctions globale de vérification de santé de l'application
    getHealth() {
      axios({
        method: 'get',
        url: '/json/health',
      })
      .then((response) => {
        console.log(response);
        this.getHealthNmap();
        this.getHealthModules();
        this.getAddressFamily();
        this.getInterfaces();
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
    },
    // fonctions de vérification de présence de nmap
    getHealthNmap() {
      axios({
        method: 'get',
        url: '/json/health/nmap',
      })
      .then((response) => {
        console.log(response);
        this.health['nmap'] = response.data.nmap;
      })
      .catch(function (error) {
        // TODO envoyer en toast une erreur personnalisé nmap
        console.log(error);
      });
    },
    // fonctions de vérification de présence des dépendances 
    getHealthModules() {
      axios({
        method: 'get',
        url: '/json/health/dependencies',
      })
      .then((response) => {
        console.log(response);
        this.health['dependencies'] = response.data.dependencies;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
    },
    // fonction de récupération des familles d'adresses locales : 
    getAddressFamily() {
      axios({
        method: 'get',
        url: '/json/address_family',
      })
      .then((response) => {
        console.log(response);
        this.address_family = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
    },
    // fonction de récupération des interfaces 
    getInterfaces() {
      axios({
        method: 'get',
        url: '/json/interfaces',
      })
      .then((response) => {
        console.log(response);
        this.interfaces = response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
    },
    // fonction de test de trigger
    funcTestTrigger() {
      console.log("trigger !!!");
    },
  },
});

app.use(Quasar);
Quasar.Lang.set(Quasar.Lang.fr)
Quasar.IconSet.set(Quasar.IconSet.lineAwesome);
app.mount('#EchoSounderApp');