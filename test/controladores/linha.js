let request = require('supertest');
let connection = require('mongodb').connect;
let app = require('../../config/express-config')();

let ValidadorDeAmbiente = require('../util/validadorDeAmbiente');
let DatabaseCleaner = require('database-cleaner');

describe('Testando controlador linha.js',() => {

   before(() => {
     let validador = new ValidadorDeAmbiente();
     validador.validar();
   });
   
   beforeEach((done) => {
     connection('mongodb://localhost/test',(erro,db) => {
         
         let databaseCleaner = new DatabaseCleaner('mongodb');

         databaseCleaner.clean(db,() => {
            db.createCollection('Linha',null,(linhaErro,linhaCollection) => {
                linhaCollection.insert([
                    {numero:'8765',clienteId:209,descr:'Linha 8765',atualizacao:new Date('2016-03-21T19:46:19.338Z'),trajetos:{nome:'Penha/Alvorada',sentido:'ida'}},
                    {numero:'8766',clienteId:209,descr:'Linha 8766',atualizacao:new Date('2016-03-21T19:46:19.338Z'),trajetos:{nome:'Madureira/Alvorada',sentido:'ida'}},
                    {numero:'8767',clienteId:209,descr:'Linha 8767',atualizacao:new Date('2016-03-22T19:46:19.338Z'),trajetos:{nome:'Madureira/Alvorada',sentido:'volta'}},
                    {numero:'8768',clienteId:209,descr:'Linha 8768',atualizacao:new Date('2016-03-23T19:46:19.338Z'),trajetos:{nome:'Fundao/Alvorada',sentido:'ida'}}
                ],() => done());
            });
         });
     });
   });
   
    it('#Consultando linha pelo número',done => {
        
        const numero = '8765';
        
        request(app)
                .get('/v1/linhas')
                .query(`numero=${numero}`)
                .timeout(30000)
                .expect('Content-Type',/json/)
                .expect((res) => res.body = {numero:res.body.numero})
                .expect(200,{numero:numero})
                .end(done); 
    }); 
    
    it('#Consultando linha cujo o número não existe',done => {
        request(app)
                .get('/v1/linhas')
                .query('numero=000987')
                .timeout(30000)
                .expect(204)
                .end(done); 
    });

    it('#Consultando linhas com modificação após a data',done => {
        request(app)
                .get('/v1/linhas')
                .query('dataAtualizacao=2016-03-20')
                .timeout(30000)
                .expect('Content-Type',/json/)
                .expect((res) => {
                    if(res.body.length < 4)
                        throw new Error('Quantidade de linhas inválidas');
                })
                .expect(200)
                .end(done); 
    });

    it('#Listando linhas por dataAtualizacao sem linha modificada após a data',done => {
        request(app)
                .get('/v1/linhas')
                .query('dataAtualizacao=2020-03-25')
                .timeout(30000)
                .expect(204)
                .end(done); 
    });

    it('#Listando linhas por dataAtualizacao e número',done => {
        
        const numero = '8766';
        
        request(app)
                .get('/v1/linhas')
                .query('dataAtualizacao=2016-03-20')
                .query(`numero=${numero}`)
                .timeout(30000)
                .expect('Content-Type',/json/)
                .expect(res => res.body = {numero:numero})
                .expect(200,{numero:numero})
                .end(done); 
    });

    it('#Listando linha pelo número e data de atualização, que não foi atualizada após a data',done => {
        request(app)
                .get('/v1/linhas')
                .query('dataAtualizacao=2020-03-25')
                .query('numero=8766')
                .timeout(30000)
                .expect(204)
                .end(done);  
    });

    it('#Listando todas as linhas do cliente',done => {
        request(app)
                .get('/v1/linhas')
                .timeout(30000)
                .expect('Content-Type',/json/)
                .expect(res => res.body = {total:res.body.length})
                .expect(200,{total:4})
                .end(done);  
    });
}); 