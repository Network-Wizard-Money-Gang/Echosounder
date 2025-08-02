import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue Graph créée");
    // une foie l'application monté sur le DOM, on crée le graph
    this.cyto = cytoscape({
      container: document.getElementById('mynetwork')
    });
    this.loadStyle();
    console.log(this);
  },
    data() {
      return {
        // ici on ajoute les variables manipulables du graph
        rootColor : getComputedStyle(document.documentElement),
        cyto : {},
        options : {
          name: 'fcose', // cose est quand même pas mal...
          fit: true,  // Whether to fit the network view after when done
          padding: 30,
          animate: true, // TODO : l'animation est constante, mais la force n'est pas recalculé, trouvé un moyen pour que ça soit le cas
          animationDuration: 1000,
          animationEasing: 'ease-out',
          //infinite: 'end', // OW SHI__
          nodeDimensionsIncludeLabels: true, // OUUUIIIIII
          randomize: true, // ça semble mettre les noeud dans leur ordre d'arrivée, ça me plait.
          packComponents: true,
        },
        styles : [],
        layout : undefined,
        listLocalScanFunc : {
          'request_arp_scan' : this.getARPScan,
          'request_fast_ping' : this.getFastScan,
          'request_dhcp_cidr_scan' : this.getDHCP_CIDRScan,
          'request_traceroute_cidr_scan' : this.getTracerouteCIDRScan,
        },
        listMachineScanFunc :{},
        listGlobalFunc : {
          'request_traceroute_local_scan' : this.getTracerouteLocalScan, 
          'request_traceroute_global_scan' : this.getTracerouteGlobalScan,
          'request_resolve_as_scan' : this.getResolveAS,
        },
      }
    },
    methods: {
      // fonction de création/mise à jour du thème
      loadStyle : function() {
        this.styles = [
          {
            selector: 'node',
            css: {
              'shape' : 'octagon',
              'color' : this.rootColor.getPropertyValue('--text2'),
              'background-color' : this.rootColor.getPropertyValue('--fond-noeuds'),
              'border-style' : 'none',
              'content': 'data(label)', // méga important, détermine quoi afficher comme donnée dans le label de noeud
              'text-outline-color': this.rootColor.getPropertyValue('--background-general'), 
              'text-outline-width' : 1,
              'text-valign': 'top',
              'text-halign': 'center',
              'opacity' : 1,
              'text-wrap': 'wrap',
              'background-fit' : 'contain',
              'font-family' : 'Hack',
              'z-index' : 10,
            },
          },
          {
            selector: 'node[type="note"]',
            css: {
              'shape' : 'round-rectangle',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap' : 'wrap',
              'font-size' : 8,
              'text-wrap': 'wrap',
              'text-max-width' : 260,
              'text-overflow-wrap' : 'whitespace',
              'text-justification' : 'auto',
              'width' : (node) => { return Math.min(260, node.data('label').length * 7) },
              'height' : (node) => { return (Math.floor(node.data('label').length/45) + 1) * 8 },
              'z-index' : 5,
            },
          },
          {
            selector: 'node[type="IP"]',
            css: {
              'background-image' : '/static/img/icone/ip_bg.png',
            },
          },
          {
            selector: 'node[type = "Service"]',
            css: {
              'width': '20px',
              'height': '20px',
              'background-image' : '/static/img/icone/service_bg.png',
            },
          },
          {
            selector: 'node[label*="gateway"]',
            css: {
              'background-image' : '/static/img/icone/gateway_bg.png',
            },
          },
          {
            selector: 'node[data.OS@="Windows"]',
            css: {
              'background-image' : '/static/img/icone/windows_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "Linux"]',
            css: {
              'background-image' : '/static/img/icone/linux_bg.png',
            },
          },
          {
            selector: 'node[data.OS @= "Unknown"]',
            css: {
              'background-image' : '/static/img/icone/unknown_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "Android"]',
            css: {
              'background-image' : '/static/img/icone/android_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "Mac OS X"]',
            css: {
              'background-image' : '/static/img/icone/mac_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "BSD"]',
            css: {
              'background-image' : '/static/img/icone/freebsd_bg.png',
            },
          },
          {
            selector: ':parent',
            css: {
              'text-valign': 'top',
              'text-halign': 'center', 
              'background-opacity': '0',
              'z-index' : -5,
            },
          },
          {
            selector: 'node:selected',
            css: {
              'border-width' : 2,
              'border-style' : 'solid',
              'border-color' : this.rootColor.getPropertyValue('--widget-background1'), 
              'ghost' : 'yes',
              "ghost-offset-y": 1,
              'ghost-opacity': 0.4,
            },
          },
          {
            selector: 'edge',
            css: {
              'line-color' : this.rootColor.getPropertyValue('--widget-background3'),
              'target-arrow-color' : this.rootColor.getPropertyValue('--widget-strong-contour1'), 
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'opacity' : 0.5,
            },
          },
          {
            selector: 'edge[typelink = "upstream"]',
            css: {
              'line-color' : this.rootColor.getPropertyValue('--widget-strong-contour2'),
              'target-arrow-color' : this.rootColor.getPropertyValue('--widget-strong-contour1'), 
              'width': 4, // épaisseur de l'edge sélectionné
              'opacity' : 0.8,
            },
          },
        ];
        this.cyto.style(this.styles);
      },
      //// fonctions de scan local
      // fonctions de récupération de donnée scan ARP
      getARPScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan ARP");
        axios({
          method : 'POST',
          url : '/json/arp_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "réception d'un scan ARP");
          console.log(response.data);
          // on appel la fonction de création de graphs :
          this.createCytoVlanGraph(response.data);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
          console.log(error);
        })
      },
      // fonctions de récupérations de donnée Fast Scan (ICMP ping)
      getFastScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan FastPing");
        axios({
            method : 'POST',
            url : '/json/fast_scan',
            headers: {'Content-Type': 'application/json'},
            data : {'cible' : cible},
          }).then((response) => {
            // si la requête passe :
            mitt.emitter.emit('echo_toast_scan', "réception d'un scan FastPing");
            console.log(response.data);
            // on appel la fonction de création de graphs :
            this.createCytoVlanGraph(response.data);
          }).catch((error) => {
            // si la requête échoue :
            mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
            console.log(error);
          }
        );
      },
      // fonction d'obtention d'IP du réseau local via DHCP scan sur CIDR
      getDHCP_CIDRScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan DHCP CIDR");
        axios({
          method : 'POST',
          url : '/json/dhcp_cidr_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "réception d'un scan DHCP CIDR");
          console.log(response.data);
          // on appel la fonction de création de graphs :
          this.createCytoCIDRGraph(response.data, cible);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
          console.log(error);
        });
      },
      // fonction d'obtention d'IP du réseau local (ou opérateur) via traceroute CIDR
      getTracerouteCIDRScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan Traceroute CIDR");
        axios({
          method : 'POST',
          url : '/json/trace_cidr_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "réception d'un scan Traceroute CIDR");
          console.log(response.data);
          // on appel la fonction de création de graphs :
          this.createCytoTraceCIDRGraph(response.data);
        }).catch((error) => {
        // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
          console.log(error);
        });
      },

      //// fonctions du menu de découverte général
      // fonction d'obtention d'IP des réseaux locaux via traceroute
      getTracerouteLocalScan : function() {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan traceroute local");
        let list_local_cidr = [
            "0.0.0.0/8", 
            "100.64.0.0/10",
            "127.0.0.0/8", 
            "169.254.0.0/16", 
            "192.0.0.0/24", 
            "192.0.2.0/24", 
            "192.88.99.0/24",
            "192.175.48.0/24",
            "198.18.0.0/15", 
            "198.51.100.0/24", 
            "203.0.113.0/24",
            "224.0.0.0/4", 
            "233.252.0.0/24",
            "240.0.0.0/4", 
            "255.255.255.255/32",
        ];
        list_local_cidr.forEach((cidr, index) => {
          let interval = 5000; // 5 secondes entre chaque scan
          setTimeout(() => {
            axios({
              method : 'POST',
              url : '/json/trace_cidr_scan',
              headers: {'Content-Type': 'application/json'},
              data : {'cible' : cidr},
            }).then((response) => {
              // si la requête passe :              
              mitt.emitter.emit('echo_toast_scan', "réception d'un scan Traceroute Local");
              // on appel la fonction de création de graphs :
              this.createCytoTraceCIDRGraph(response.data);
            }).catch((error) => {
            // si la requête échoue :
              mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
              console.log(error);
            }
            );
          }, index * interval);
        });
      },
      // fonction d'obtention d'IP du réseau (via rootserver opérateur) via traceroute
      getTracerouteGlobalScan : function() {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan Traceroute CIDR");
        let list_root_server_ip =  [
          "198.41.0.4",
          "199.9.14.201",
          "192.33.4.12",
          "199.7.91.13",
          "192.203.230.10",
          "192.5.5.241",
          "192.112.36.4",
          "198.97.190.53",
          "192.36.148.17",
          "192.58.128.30",
          "193.0.14.129",
          "199.7.83.42",
          "202.12.27.33",
        ];
        list_root_server_ip.forEach((cible, index) => {
          let interval = 5000; // 5 secondes entre chaque scan
          setTimeout(() => {
            axios({
              method : 'POST',
              url : '/json/trace_scan',
              headers: {'Content-Type': 'application/json'},
              data : {'cible' : cible},
            }).then((response) => {
              // si la requête passe :              
              mitt.emitter.emit('echo_toast_scan', "réception d'un scan Traceroute CIDR");
              console.log(response.data);
              // on appel la fonction de création de graphs :
              this.createCytoTraceGraph(response.data);
            }).catch((error) => {
              // si la requête échoue :
              mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
              console.log(error);
            });
          }, index * interval);
        });
      },

      // fonction d'assignation des signaux aux fonctions adéquats
      receiveEmitRequestLocalScan : function(args) {
        console.log(args);
        this.listLocalScanFunc[args.type](args.cible);
      },
      receiveEmitRequestGeneralScan : function(args) {
        console.log(args);
        this.listGlobalFunc[args.type]();
      },

      //// fonction de rendu du graph en fonction pour les scan locaux
      // fonction de création du graph à partir d'un scan CIDR normal
      createCytoVlanGraph : function(scan_data) {
        let nodes = [];
        let edges = [];
        //ajout de la représentation du VLAN
        nodes.push(
          {
            group:'nodes',
            data: {
              id : scan_data.vlan,
              label : scan_data.vlan,
              type : 'VLAN',
            },
          }
        );

        // ajout du routeur gateway
        nodes.push(
          {
            group:'nodes',
            data: {
              id : (scan_data.local_data.gateway_ip + '\n' + scan_data.local_data.gateway_mac),
              label : ("gateway " + scan_data.local_data.gateway_ip + "\n" + scan_data.local_data.gateway_mac),
              type : 'IP',
              typeip: ipaddr.parse(scan_data.local_data.gateway_ip).range(),
              data : scan_data.local_data,
              data_ip : scan_data.local_data.gateway_ip,
              parent : scan_data.vlan,
            },
          }
        );

        // ajout des entités nmap :
        scan_data.scan.forEach(function(nodeAdd) {
          if(nodeAdd.IP != scan_data.local_data[2]) {
            nodes.push(
              {
                group:'nodes',
                data: {
                  id : (nodeAdd.IP + '\n' + nodeAdd.mac),
                  label : (nodeAdd.IP + '\n' + nodeAdd.mac),
                  type : 'IP',
                  typeip : ipaddr.parse(nodeAdd.IP).range(),
                  data : nodeAdd,
                  data_ip : nodeAdd.IP,
                  parent : scan_data.vlan,
                },
              }
            );
          }
        });

        // liaison de l'ensemble des entités nmap à la gateway : 
        let gateway_id = (scan_data.local_data.gateway_ip + '\n' + scan_data.local_data.gateway_mac);
        nodes.forEach(function(nodeI) {
          if((nodeI.data.type == 'IP') && (nodeI.data.id != gateway_id)) { // on évite de créer un lien entre autre chose qu'une IP et la gateway
            edges.push(
              {
                group:'edges',
                data : {
                  id : ('link ' + gateway_id + " " + nodeI.data.id + " "),
                  source : nodeI.data.id,
                  target : (scan_data.local_data.gateway_ip + '\n' + scan_data.local_data.gateway_mac),
                  type: 'IPtoVLAN',
                  parent : scan_data.vlan,
                }
              }
            );
          }
        });

        // on ajoute l'ensemble des ip au graph
        this.cyto.add(nodes);
        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      // fonction de création du graph à partir d'un scan CIDR normé (par exemple DHCP)
      createCytoCIDRGraph : function(scan_data, cidr) {
        if(scan_data.scan.length == 0) { // on vérifie qu'on a pas juste un scan vide
          mitt.emitter.emit('echo_toast_scan_error', "erreur : Scan reçu vide" );
          return;
        }
        // on commence la création de la vue graphe
        let nodes = [];
        let edges = [];
        //ajout de la représentation du VLAN
        nodes.push(
          {
            group:'nodes',
            data: {
              id : cidr,
              label : cidr,
              type : 'VLAN',
            },
          }
        );

        // ajout des entités nmap :
        scan_data.scan.forEach(function(nodeAdd) {
          if(nodeAdd.mac != undefined) { nodeAdd.mac = nodeAdd.mac.toLowerCase(); };
          nodes.push(
            {
              group:'nodes',
              data: {
                id : (nodeAdd.ipv4 + '\n' + nodeAdd.mac),
                label : (nodeAdd.ipv4 + '\n' + nodeAdd.mac),
                type : 'IP',
                typeip : ipaddr.parse(nodeAdd.ipv4).range(),
                data : nodeAdd,
                data_ip : nodeAdd.ipv4,
                parent : cidr,
              },
            }
          );
        });

        // on ajoute l'ensemble des ip au graph
        this.cyto.add(nodes);
        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      // fonction de création du graph à partir d'un scan trace CIDR
      createCytoTraceCIDRGraph : function(scan_data) {
        scan_data.scan.forEach((trace) => { // l'arnaque se situe ici (vous avez cru quoi ? que j'allais tout recoder ?)
          this.createCytoTraceGraph({'scan': trace});
        });
      },
      
      // fonction de rendu du graph pour les scans plus orientés IP/services
      // fonction de création du graph à partir d'un scan trace
      createCytoTraceGraph : function(scan_data) {
        let nodes = [];
        let edges = [];

        // on ajoute les noeuds
        scan_data.scan.forEach((ipdata) => {
          let ip = ipdata[0];
          // on récupère le node déjà créé avec l'ip associé : 
          let node_exist = this.cyto.elements('node[data_ip = "' + ip + '"]');
          if(node_exist.length == 0) { // cas où le noeud est à créer
            nodes.push(
              {
                group:'nodes',
                data: {
                  id : (ip),
                  label : (ip),
                  type : 'IP',
                  typeip : ipaddr.parse(ip).range(),
                  data : {'ip' : ip},
                  data_ip : ip,
                  parent : this.getVLANByIP(ip), // a retravailler : on doit préalablement voir si le noeud rentre dans le CIDR...
                },
              }
            );
          }else { // cas où le noeud existe déjà

          }
        });

        // on ajoute l'ensemble des ip au graph
        this.cyto.add(nodes);

        // on ajoute les liens si possible
        for(let key in scan_data.scan){
          if(key == 0) {
          }else {
            console.log(scan_data.scan);
            console.log(key);
            let id_last_node = this.getNodeIdByIP(scan_data.scan[key-1][0]);
            console.log(id_last_node);
            let id_node = this.getNodeIdByIP(scan_data.scan[key][0]);
            console.log(id_node);
            let last_node_typeip = ipaddr.parse(id_last_node.split('\n')[0]).range();
            let node_typeip = ipaddr.parse(id_node.split('\n')[0]).range();
            if((last_node_typeip == 'private' & node_typeip != 'private') |
            (last_node_typeip != 'private' & node_typeip == 'private')
            ){
              edges.push({
                group:'edges',
                data : {
                  id : ('link ' + id_last_node + " " + id_node + " "),
                  source : id_last_node,
                  target : id_node,
                  type : 'traceroute',
                  typelink : 'upstream',
                }
              });
            }else {
              edges.push({
                group:'edges',
                data : {
                  id : ('link ' + id_last_node + " " + id_node + " "),
                  source : id_last_node,
                  target : id_node,
                  type : 'traceroute',
                }
              });
            }
          }
        }

        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();

        // on va maintenant lier les données aux AS 
        // NOTE : c'est une opération longue, si on parviens à la réduire à un temps raisonnable,
        // le code sera à fusionner avec le code d'au dessus...
        scan_data.scan.forEach((ipdata) => {
          let nodeAS = [];
          let nodeVlan = [];
          let ip = ipdata[0];
          let cidr = ipdata[1][0];
          let as_number = ipdata[1][1];
          let typeip = ipaddr.parse(ip).range();
          if((typeip != 'private') && (typeip != 'multicast')) {
            // on crée un AS
            nodeAS.push(
              {
                group:'nodes',
                data: {
                  id : as_number,
                  label : as_number,
                  type : 'AS',
                },
              }
            );
            // on crée un VLAN
            nodeVlan.push(
              {
                group:'nodes',
                data: {
                  id : cidr,
                  label : cidr,
                  type : 'VLAN',
                  parent: as_number,
                },
              }
            );
          }
          // on ajoute l'ensemble des VLAN + AS au graph
          this.cyto.add(nodeAS);
          this.cyto.add(nodeVlan);
          // on ajoute l'ID du node audit VLAN
          this.cyto.$('#' + this.getNodeIdByIP(ip)).move({parent : this.getVLANByIP(ip)});
        });
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      
      //// fonction utiles de manipulation du graph et des éléments réseau
      // fonction de récupération d'un ID de node via une recherche par IP
      getNodeIdByIP : function(ip) {
        return this.cyto.elements('node[data_ip = "' + ip + '"]').data('id');
      },
      // Fonction de récupération d'un VLAN via une recherche par IP
      getVLANByIP : function(ip) {
        let listVLAN = [];
        this.cyto.elements('node[type = "VLAN"]').forEach(function(node) {
          listVLAN.push(node.data('id').split('/'));
        });

        // on trie les subnet par ordre de taille 
        listVLAN.sort(function(a, b){return b[1] - a[1]});
        
        // maintenant, on doit comparer IP / range d'IP et le premier match renvoie son ID
        for (const element of listVLAN) {
          if(ipaddr.parse(ip).match(ipaddr.parse(element[0]), element[1])) {
            return element[0] + "/" + element[1];
          }
        }
      },
      // fonction de complétion des ASN avec leur vrai noms :
      getResolveAS : function() {
        this.cyto.elements('node[type = "AS"]').forEach(function(node) {
          if(node.data('as_resolution')){
            return; // si la résolution à déjà été faite, on s'épargne de la refaire
          }
          // si il s'agit d'un multi-origin AS set, on fait deux requêtes, sinon une seule
          if(node.data('label').includes('_')){
            let list_asn = node.data('label').split('_');
            // on crée deux requêtes
            let req1 = {
              method : 'GET',
              url : 'https://rdap.arin.net/registry/autnum/' + list_asn[0],
              headers: {'Content-Type': 'application/rdap+json'},
            };
            let req2 = {
              method : 'GET',
              url : 'https://rdap.arin.net/registry/autnum/' + list_asn[1],
              headers: {'Content-Type': 'application/rdap+json'},
            };

            // on récupère les info d'AS
            axios(req1).then((response) => {
                // si la requête passe :
                $scope.$parent.sendToastData('AS Resolution', "Récupération de donnée RDAP", 'echo_toast_scan');
                // on les fout dans le label du noeud
                if(node.data('label').includes(' ')) {
                  node.data('label', node.data('label') + " & " + response.data.name);
                } else{
                  node.data('label', node.data('label') + " " + response.data.name);
                }
                // on spécifie que la résolution a été effectué
                node.data('as_resolution', true);
              }).catch((error) => {
                // si la requête échoue :
                $scope.$parent.sendToastData('AS Resolution', "erreur : " + error, 'echo_toast_error');
                console.log(error);
              });

            // on récupère les info d'AS
            axios(req2).then((response) => {
              // si la requête passe :
              $scope.$parent.sendToastData('AS Resolution', "Récupération de donnée RDAP", 'echo_toast_scan');
              // on les fout dans le label du noeud
              if(node.data('label').includes(' ')) {
                node.data('label', node.data('label') + " & " + response.data.name);
              } else{
                node.data('label', node.data('label') + " " + response.data.name);
              }
              // on spécifie que la résolution a été effectué
              node.data('as_resolution', true);
            }).catch((error) => {
              // si la requête échoue :
              $scope.$parent.sendToastData('AS Resolution', "erreur : " + error, 'echo_toast_error');
              console.log(error);
            });

          }else {
            // on crée une requête
            let req = {
              method : 'GET',
              url : 'https://rdap.arin.net/registry/autnum/' + node.data('label'),
              headers: {'Content-Type': 'application/rdap+json'},
            };
            // on récupère les info d'AS
            axios(req).then((response) => {
              // si la requête passe :
                $scope.$parent.sendToastData('AS Resolution', "Récupération de donnée RDAP", 'echo_toast_scan');
                // on les fout dans le label du noeud
                node.data('label', node.data('label') + " " + response.data.name);
                // on spécifie que la résolution a été effectué
                node.data('as_resolution', true);
              }).catch((error) => {
              // si la requête échoue :
                $scope.$parent.sendToastData('AS Resolution', "erreur : " + error, 'echo_toast_error');
                console.log(error);
              });
          }
        });
      },
  },
})