"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";

function Main() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [resultKey, setResultKey] = useState("");
  const [error, setError] = useState(null);
  const [keyFromChallenge, setKeyFromChallenge] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    registerUser();
  };

  function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  // Registration function
  async function registerUser() {
    let publicKey;
    console.log(JSON.stringify({ username }));
    await fetch(`https://248a-14-176-232-234.ngrok-free.app/register/start`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify({ username, key }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        const uint8Array = new Uint8Array(data.challenge);

        console.log(uint8Array.buffer);
        publicKey = {
          ...data,
          challenge: uint8Array.buffer,
          user: { ...data.user, id: str2ab(data.user.id) },
        };

        console.log(publicKey);
      });

    setKeyFromChallenge(ab2str(publicKey.challenge));

    const credential = await navigator.credentials.create({
      publicKey,
    });

    //     const data = await fido2Create(publicKey, username);

    //     console.log({ data });

    //     // this.http
    //     //   .post("http://localhost:3001/register/finish", data)
    //     //   .subscribe((data) => {
    //     //     if (data) {
    //     //       alert("Successfully created using webAuthn");
    //     //     }
    //     //   });
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

  // Authentication credentials
  async function auth() {
    try {
      setError(null);
      const result = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([183, 148, 245]),
          rpId: "passkey-flame.vercel.app",
          timeout: 1800000,
          attestation: "none",
          excludeCredentials: [],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: true,
            residentKey: "required",
            userVerification: "required",
          },
        },
      });
      console.log("data", result.getClientExtensionResults());

      setStep(3);
    } catch (error) {
      setError(error.message);
      console.error("Authentication error:", error);
    }
  }

  // write key to credentials
  const writeKey = useCallback(async () => {
    try {
      setError(null);
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([183, 148, 245]),
          rpId: "passkey-flame.vercel.app",
          authenticatorSelection: {
            residentKey: "preferred", // Or "required".
          },
          timeout: 1800000,
          attestation: "none",
          excludeCredentials: [],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: true,
            residentKey: "required",
            userVerification: "required",
          },
          extensions: {
            largeBlob: {
              write: str2ab(keyInput), // Include data in the extension
            },
          }, // Create a unique challenge value
        },
      });
      console.log(credential.getClientExtensionResults().largeBlob);
    } catch (error) {
      setError(error.message);
      console.error("Authentication error:", error);
    }
  }, [keyInput]);

  const messageHandler = (key) => {
    // Construct URL with parameters
    const url = `napa://?key=${key}`;

    // Trigger native iOS app navigation
    if (navigator.userAgent.includes("Safari")) {
      // For Safari on iOS
      window.location = url;
    } else {
      // For other browsers or non-iOS platforms
      let xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.onload = function () {
        if (xhr.status === 200) {
          // Successful navigation to native app
          alert("Parameters passed successfully");
        } else {
          // Navigation error
          alert("Failed to open native app: " + xhr.statusText);
        }
      };
      xhr.send();
    }
  };

  const readKey = useCallback(async () => {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([183, 148, 245]),
        rpId: "passkey-flame.vercel.app",
        timeout: 1800000,
        attestation: "none",
        excludeCredentials: [],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: true,
          residentKey: "required",
          userVerification: "required",
        },
        extensions: {
          largeBlob: {
            read: true, // Include data in the extension
          },
        },
      },
    });
    const key = ab2str(assertion.getClientExtensionResults().largeBlob.blob);
    setResultKey(key);

    messageHandler(key);
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
            <h1 className="title">WebAuthn Demo</h1>
            <input
              className="input"
              name="username"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <input
              className="input"
              name="key"
              placeholder="Key"
              value={key}
              onChange={(event) => setKey(event.target.value)}
            />
            <button className="btn" type="submit">
              Create account
            </button>
          </form>

          <div style={{ marginTop: "10px" }}>
            <b>Key from challenge: </b> {keyFromChallenge}
          </div>
          <button style={{ marginTop: "20px" }} onClick={() => setStep(1)}>
            back to login
          </button>
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
            <button className="btn" onClick={() => setStep(1)}>
              logout
            </button>
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

  return (
    <div>
      <p style={{ color: "red" }}>{error}</p>
      {renderStep[step]()}
    </div>
  );
}

export default Main;
