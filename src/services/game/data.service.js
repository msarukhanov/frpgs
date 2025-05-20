const knex = require('../../config/db.config');
const {v4: uuidv4} = require('uuid');
const fs = require('fs');
const JSZip = require('jszip');

const filesList = ['main','world','rules','data'];

module.exports = {
    getView,
    getEdit,

    saveEdit,

    getGameAssets,
    setGameAssets,
};

async function getView() {
    return {
        err: true,
        type: "db"
    };
}

async function getEdit({id}) {
    const directory = __dirname + '/../../../games/'+id+'/';
    let data = {};
    try {
        filesList.forEach((file) => {
            if (fs.existsSync(directory + file + '.json')) {
                data[file] = fs.readFileSync(directory + file + '.json', 'utf-8');
            }
        });
        return data;
    }
    catch (e) {
        return {
            err:true
        }
    }
}

async function saveEdit({id, data, player}) {
    const directory = __dirname + '/../../../games/'+id+'/';
    const files = ['main','world','rules','data'];
    try {
        filesList.forEach((file)=>{
            if(data[file] && fs.existsSync(directory+file+'.json')) {
                fs.writeFileSync(directory+file+'.json', JSON.stringify(data[file]), 'utf-8');
            }
        });
        return {};
    }
    catch (e) {
        return {
            err:true
        }
    }
}

async function getGameAssets({id, file}) {
    const directory = __dirname + '/../../../games/'+id+'/assets/';
    if(!fs.existsSync(directory)) {
        return {
            err:true,
            description: "no such directory"
        }
    }
    try {
        const zip = new JSZip();
        const jsonContent = fs.readFileSync(directory + file + '.json', 'utf-8') || '{}';
        if(!jsonContent) {
            return {
                err:true,
                description: "error loading file 2"
            }
        }
        zip.file(file+'.json', jsonContent);
        return await zip.generateAsync({ type: 'nodebuffer' });
    }
    catch (e) {
        return {
            err:true,
            description: "error loading file 1"
        }
    }
}

async function setGameAssets({id, file, data}) {
    const directory = __dirname + '/../../../games/'+id+'/assets/';
    if(!fs.existsSync(directory)) {
        return {
            err:true,
            description: "no such directory"
        }
    }
    try {
        if(data && fs.existsSync(directory+file+'.json')) {
            fs.writeFileSync(directory+file+'.json', JSON.stringify(data), 'utf-8');
        }
        return {};
    }
    catch (e) {
        return {
            err:true,
            description: "error loading file 1"
        }
    }
}