import * as codeMirror from 'codemirror'
import * as xml from 'codemirror/mode/xml/xml'
import { SignedXml, xpath }  from 'xml-crypto'
import { DOMParser } from 'xmldom'

const textArea = document.getElementById('target-text-area')
const status = document.getElementById('status')
const editor = codeMirror.fromTextArea(textArea, { lineWrapping: true, mode: 'xml', theme: 'monokai', viewportMargin: Infinity })

const cert = '-----BEGIN CERTIFICATE-----\nMIIEFzCCAv+gAwIBAgIUFJsUjPM7AmWvNtEvULSHlTTMiLQwDQYJKoZIhvcNAQEFBQAwWDELMAkGA1UEBhMCVVMxETAPBgNVBAoMCFN1YnNwYWNlMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxHzAdBgNVBAMMFk9uZUxvZ2luIEFjY291bnQgNDIzNDkwHhcNMTQwNTEzMTgwNjEyWhcNMTkwNTE0MTgwNjEyWjBYMQswCQYDVQQGEwJVUzERMA8GA1UECgwIU3Vic3BhY2UxFTATBgNVBAsMDE9uZUxvZ2luIElkUDEfMB0GA1UEAwwWT25lTG9naW4gQWNjb3VudCA0MjM0OTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKrAzJdY9FzFLt5blArJfPzgi87EnFGlTfcV5T1TUDwLBlDkY/0ZGKnMOpf3D7ie2C4pPFOImOogcM5kpDDL7qxTXZ1ewXVyjBdMu29NG2C6NzWeQTUMUji01EcHkC8o+Pts8ANiNOYcjxEeyhEyzJKgEizblYzMMKzdrOET6QuqWo3C83K+5+5dsjDn1ooKGRwj3HvgsYcFrQl9NojgQFjoobwsiE/7A+OJhLpBcy/nSVgnoJaMfrO+JsnukZPztbntLvOl56+Vra0N8n5NAYhaSayPiv/ayhjVgjfXd1tjMVTOiDknUOwizZuJ1Y3QH94vUtBgp0WBpBSs/xMyTs8CAwEAAaOB2DCB1TAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBRQO4WpM5fWwxib49WTuJkfYDbxODCBlQYDVR0jBIGNMIGKgBRQO4WpM5fWwxib49WTuJkfYDbxOKFcpFowWDELMAkGA1UEBhMCVVMxETAPBgNVBAoMCFN1YnNwYWNlMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxHzAdBgNVBAMMFk9uZUxvZ2luIEFjY291bnQgNDIzNDmCFBSbFIzzOwJlrzbRL1C0h5U0zIi0MA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQUFAAOCAQEACdDAAoaZFCEY5pmfwbKuKrXtO5iE8lWtiCPjCZEUuT6bXRNcqrdnuV/EAfX9WQoXjalPi0eM78zKmbvRGSTUHwWw49RHjFfeJUKvHNeNnFgTXDjEPNhMvh69kHm453lFRmB+kk6yjtXRZaQEwS8Uuo2Ot+krgNbl6oTBZJ0AHH1MtZECDloms1Km7zsK8wAi5i8TVIKkVr5b2VlhrLgFMvzZ5ViAxIMGB6w47yY4QGQB/5Q8ya9hBs9vkn+wubA+yr4j14JXZ7blVKDSTYva65Ea+PqHyrp+Wnmnbw2ObS7iWexiTy1jD3G0R2avDBFjM8Fj5DbfufsE1b0U10RTtg==\n-----END CERTIFICATE-----\n'

function validate(instance) {
  const extraSecurity = document.location.search === '?extra-secure'
  let res = false
  try {
    const xml = instance.getValue()
    const doc = new DOMParser().parseFromString(xml)
    const signature = xpath(doc, "//*[local-name(.)='Signature']")[0]
    const sig = new SignedXml()
    sig.keyInfoProvider = {
      getKeyInfo: () => "<X509Data></X509Data>",
      getKey: () => cert
    }
    sig.loadSignature(signature)
    res = sig.checkSignature(xml)
    if (extraSecurity) {
      const refUri = sig.references[0].uri.substring(1)
      const ass = xpath(doc, "/*/*[local-name(.) = 'Assertion']")[0]
      console.log('ass', ass)
      const idAttribute = ass.getAttribute('ID') ? 'ID' : 'Id';
      console.log('idAttribute', idAttribute)
      if (ass.getAttribute(idAttribute) !== refUri) { res = false }
      if (xpath(doc, "//*[@" + idAttribute + "]").length > 1) { res = false }
    }
  }
  catch(err) {
    status.innerText = '' + err
    document.body.className = 'invalid-saml'
    return;
  }
  status.innerText = res ? 'Signature is VALID' : 'Signature is NOT VALID'
  document.body.className = res ? 'valid-saml' : 'invalid-saml'
}

validate(editor)
editor.on('change', validate)

