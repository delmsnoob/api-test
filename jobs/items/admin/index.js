const methods = {
  bootstrap () {
    // console.log('Hello Jobs')
  }
}

setInterval(() => {
  setTimeout(() => {
    methods.bootstrap()
  }, 5000)
}, 20000)
