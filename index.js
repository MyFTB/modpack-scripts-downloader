const scriptFilePatterns = [
    /^kubejs/,
    /^scripts/,
    /^modpack\/\S+\/scripts/,
]

function clearAlerts() {
    let alerts = document.getElementById('alert-container')
    while (alerts.firstChild) alerts.removeChild(alerts.firstChild)
}

function showAlert(type, message) {
    let alert = document.createElement('div')
    alert.setAttribute('role', 'alert')
    alert.classList.add('alert')
    alert.classList.add('alert-' + type)
    alert.innerText = message

    clearAlerts()

    let alerts = document.getElementById('alert-container')
    alerts.appendChild(alert)
}

async function getModpacks() {
    return axios.get('https://packs.myftb.de/packs/packages.php')
}

async function getModpackInfo(name) {
    return axios.get('https://packs.myftb.de/packs/' + name)
}

async function onClickDownload() {
    clearAlerts()

    try {
        let selectedModpack = document.getElementById('modpack').value
        let modpack = await getModpackInfo(selectedModpack)
        let files = modpack.data.tasks
        let scriptFiles = files.filter(file => {
            for (let pattern of scriptFilePatterns) {
                if (pattern.test(file.to)) {
                    return true
                }
            }

            return false
        })

        if (scriptFiles.length === 0) {
            showAlert('danger', 'Für dieses Modpack konnten keine Skript-Dateien gefunden werden')
            return
        }

        let filePromises = scriptFiles.map(file => axios.get('https://packs.myftb.de/objects/' + file.location, {responseType: 'blob', target_file: file}))
        let downloadedFiles = await Promise.all(filePromises)
        
        let zip = new JSZip()
        for (let file of downloadedFiles) {
            zip.file(file.config.target_file.to, file.data)
        }

        let zipFile = await zip.generateAsync({type: 'blob'})
        saveAs(zipFile, 'scripts_' + modpack.data.name + '_' + modpack.data.version + '.zip')

        showAlert('success', 'Dein Skript-Download startet nun!')
    } catch (e) {
        console.error(e)
        showAlert('danger', 'Beim Download ist ein Fehler aufgetreten')
    }
}

async function onPageLoad() {
    let modpackResponse = await getModpacks()
    let modpacks = modpackResponse.data.packages
    modpacks.sort((a, b) => a.title.localeCompare(b.title))

    let modpackSelect = document.getElementById('modpack')
    for (let modpack of modpacks) {
        let selectOption = document.createElement('option')
        selectOption.value = modpack.location
        selectOption.innerText = modpack.title
        modpackSelect.appendChild(selectOption)
    }

    document.getElementById('download-btn').addEventListener('click', onClickDownload)
}

document.addEventListener('DOMContentLoaded', onPageLoad)
