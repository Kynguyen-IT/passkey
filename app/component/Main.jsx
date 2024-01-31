import React, { useCallback, useEffect, useMemo, useState } from "react";

function Main() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [resultKey, setResultKey] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    registerUser(username);
  };

  const challenge = useMemo(() => {
    return new Uint8Array([183, 148, 245]);
  }, []);

  // Registration function
  async function registerUser(displayName) {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          attestation: "enterprise",
          requireResidentKey: true,
          challenge: new Uint8Array([183, 148, 245]),
          rp: {
            name: "Test",
            id: "passkey-flame.vercel.app",
          },
          user: {
            id: new ArrayBuffer(2), // Create a unique user ID based on username
            name: displayName,
            displayName: displayName,
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            residentKey: "required", // Or "required".
          },
          extensions: {
            largeBlob: {
              support: "preferred", // Or "required".
            },
          },
        },
      });
      if (credential.getClientExtensionResults().largeBlob.supported) {
        console.log("supported largeBlob");
      }
      setStep(1);
    } catch (error) {
      console.error("Registration error:", error);
    }
  }

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  function abToObject(buf) {
    var decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(buf));
    const str = new TextDecoder().decode(buf);
    return JSON.parse(str);
  }

  // Authentication credentials
  async function auth() {
    try {
      const result = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([183, 148, 245]),
          rpId: "passkey-flame.vercel.app",
        },
      });
      console.log(result.response);

      // const clientJSON = abToObject(result.response.clientDataJSON);

      // const authenticatorData = abToObject(result.response.authenticatorData);
      // console.log({ authenticatorData });
      setStep(3);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  }

  // write key to credentials
  const writeKey = useCallback(async () => {
    try {
      return await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([183, 148, 245]),
          rpId: "passkey-flame.vercel.app",
          extensions: {
            largeBlob: {
              write: str2ab(keyInput), // Include data in the extension
            },
          }, // Create a unique challenge value
        },
      });
    } catch (error) {
      console.error("Authentication error:", error);
    }
  }, [keyInput]);

  const readKey = useCallback(async () => {
    const assertion = await navigator.credentials.get({
      mediation: "silent",
      publicKey: {
        challenge: new Uint8Array([183, 148, 245]),
        extensions: {
          largeBlob: {
            read: true, // Include data in the extension
          },
        },
      },
    });
    setResultKey(ab2str(assertion.getClientExtensionResults().largeBlob.blob));
  }, []);

  const renderStep = useMemo(
    () => ({
      1: () => (
        <div className="auth_content">
          <h1 className="title">WebAuthn Large Blob Demo</h1>
          <button className="btn" onClick={auth}>
            Log-in with WebAuthn
          </button>

          <div className="bottom">
            <p>{`Don't have an account?`}</p>
            <button onClick={() => setStep(2)}>Sign up</button>
          </div>
        </div>
      ),
      2: () => (
        <>
          <form className="form_content" onSubmit={handleSubmit}>
            <h1 className="title">WebAuthn Large Blob Demo</h1>
            <input
              className="input"
              name="username"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <button className="btn" type="submit">
              Create account
            </button>
          </form>
          <button onClick={() => setStep(1)}>back to login</button>
        </>
      ),
      3: () => (
        <div>
          <h3>
            You have successfully logged-in. Your large blob contents are:
          </h3>
          <input
            className="input"
            name="keyInput"
            placeholder="private key"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
          />
          <div>
            <button className="btn" onClick={writeKey}>
              Store large blob
            </button>
            <button className="btn">logout</button>
          </div>

          <div>
            {resultKey !== "" && <p>{resultKey}</p>}

            <button className="btn" onClick={readKey}>
              Read private key
            </button>
          </div>
        </div>
      ),
    }),
    [handleSubmit, username, keyInput, writeKey, resultKey, readKey]
  );

  return <>{renderStep[step]()} </>;
}

export default Main;
