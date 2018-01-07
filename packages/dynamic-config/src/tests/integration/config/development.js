module.exports = {
  project: {
    health: {
      control: "/javascript",
      response: Promise.resolve('DELAYED'),
    }
  }
}
