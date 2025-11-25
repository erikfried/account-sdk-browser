export class RESTClient {
    go: any;
    makeUrl: any;
    
    constructor(options: any) {
        this.go = jest.fn();
        this.makeUrl = jest.fn();
    }
}

export default RESTClient;
