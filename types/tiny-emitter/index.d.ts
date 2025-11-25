declare module 'tiny-emitter' {
    export class TinyEmitter {
        on(event: string, callback: Function, ctx?: any): this;
        once(event: string, callback: Function, ctx?: any): this;
        emit(event: string, ...args: any[]): this;
        off(event: string, callback?: Function): this;
    }

    export default TinyEmitter;
}
