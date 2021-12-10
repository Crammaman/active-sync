<template>
<div>
  <p v-if="!editing" @click="toggleSites">{{ customer.name }} <a href="#" @click="toggleEditing">edit</a></p>
  <p v-else ><input v-model="customer.name" /> <a href="#" @click="saveCustomer">save</a></p>
  <div  v-if="expanded">
    <site v-for="site in sites" :key="'site'+site.id" :site="site"></site>
  </div>
</div>
</template>
<script>
import Site from './site.vue'
export default{
  name: 'customer',
  props: ['customer'],
  data() {
    return {
      sites: [],
      editing: false,
      expanded: false
    }
  },
  methods: {
    toggleSites(){
      this.expanded = !this.expanded
      this.sites = this.customer.sites().then((sites) => this.sites = sites)
    },
    toggleEditing(){
      this.editing = !this.editing
    },
    saveCustomer(){
      this.$Customer.update(this.customer)
      this.editing = !this.editing
    }
  },
  components:{
    Site
  }
}
</script>
