class CustomHttpError extends Error {  
    status : number;
    constructor (message : string, status : number) {
      super(message)
  
      // assign the error class name in your custom error (as a shortcut)
      this.name = this.constructor.name
      this.status = status
      // capturing the stack trace keeps the reference to your error class
      Error.captureStackTrace(this, this.constructor);
  
      // you may also assign additional properties to your error
    
    }
  }

export default CustomHttpError