const { Pool, types } = require('pg')
const config = require('../config/env')

// DATE volta como texto 'AAAA-MM-DD'. Sem isso o driver cria um Date à meia-noite no fuso
// do servidor e, ao virar JSON, a data pode aparecer um dia antes para quem está em outro fuso.
types.setTypeParser(types.builtins.DATE, (valor) => valor)

// BIGINT (resultado de SUM e COUNT) volta como número em vez de texto.
// É seguro aqui: os totais ficam muito abaixo de Number.MAX_SAFE_INTEGER.
types.setTypeParser(types.builtins.INT8, (valor) => Number(valor))

const pool = new Pool({ connectionString: config.databaseUrl })

// Evita derrubar a aplicação se uma conexão ociosa cair (ex.: o banco reiniciou).
pool.on('error', (erro) => {
  console.error('[banco] erro em uma conexão ociosa:', erro.message)
})

module.exports = pool
