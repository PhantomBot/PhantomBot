/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.gmt2001.httpwsserver.x509;

import java.io.IOException;
import java.math.BigInteger;
import java.security.InvalidKeyException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.SignatureException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * Generates a SelfSigned X.509 Certificate
 *
 * Taken from https://stackoverflow.com/questions/1615871/creating-an-x509-certificate-in-java-without-bouncycastle Original code and modifications
 * by: Mike B, vbence, and Clark Hobbie
 *
 * @author gmt2001
 */
@SuppressWarnings("sunapi")
public final class SelfSignedX509CertificateGenerator {

    public static final int RECOMMENDED_KEY_SIZE = 2048;
    public static final String RECOMMENDED_SIG_ALGO = "SHA512withRSA";
    public static final int RECOMMENDED_VALIDITY_DAYS = 60;
    public static final int RECOMMENDED_RENEWAL_DAYS = 45;

    private SelfSignedX509CertificateGenerator() {
    }

    /**
     * Create a self-signed X.509 Certificate
     *
     * @param dn the X.509 Distinguished Name, eg "CN=Test, L=London, C=GB"
     * @param pair the KeyPair
     * @param days how many days from now the Certificate is valid for
     * @param algorithm the signing algorithm, eg "SHA256withRSA"
     * @return the certificate
     * @throws IOException
     * @throws CertificateException
     * @throws NoSuchAlgorithmException
     * @throws InvalidKeyException
     * @throws NoSuchProviderException
     * @throws SignatureException
     */
    public static X509Certificate generateCertificate(String dn, KeyPair pair, int days, String algorithm)
            throws IOException, CertificateException, NoSuchAlgorithmException, InvalidKeyException, NoSuchProviderException, SignatureException {
        PrivateKey privkey = pair.getPrivate();
        sun.security.x509.X509CertInfo info = new sun.security.x509.X509CertInfo();
        Instant from = Instant.now();
        Instant to = Instant.now().plus(days, ChronoUnit.DAYS);
        sun.security.x509.CertificateValidity interval = new sun.security.x509.CertificateValidity(Date.from(from), Date.from(to));
        BigInteger sn = new BigInteger(64, new SecureRandom());
        sun.security.x509.X500Name owner = new sun.security.x509.X500Name(dn);

        info.set(sun.security.x509.X509CertInfo.VALIDITY, interval);
        info.set(sun.security.x509.X509CertInfo.SERIAL_NUMBER, new sun.security.x509.CertificateSerialNumber(sn));
        info.set(sun.security.x509.X509CertInfo.SUBJECT, owner);
        info.set(sun.security.x509.X509CertInfo.ISSUER, owner);
        info.set(sun.security.x509.X509CertInfo.KEY, new sun.security.x509.CertificateX509Key(pair.getPublic()));
        info.set(sun.security.x509.X509CertInfo.VERSION, new sun.security.x509.CertificateVersion(sun.security.x509.CertificateVersion.V3));
        info.set(sun.security.x509.X509CertInfo.ALGORITHM_ID, new sun.security.x509.CertificateAlgorithmId(sun.security.x509.AlgorithmId.get(algorithm)));

        // Sign the cert to identify the algorithm that's used.
        sun.security.x509.X509CertImpl cert = new sun.security.x509.X509CertImpl(info);
        cert.sign(privkey, algorithm);

        // Update the algorith, and resign.
        info.set(sun.security.x509.CertificateAlgorithmId.NAME + "." + sun.security.x509.CertificateAlgorithmId.ALGORITHM, (sun.security.x509.AlgorithmId) cert.get(sun.security.x509.X509CertImpl.SIG_ALG));
        cert = new sun.security.x509.X509CertImpl(info);
        cert.sign(privkey, algorithm);
        return cert;
    }

    /**
     * Generate a DN string with just the CN
     *
     * @param commonName the Common Name
     * @return the formatted string
     */
    public static String generateDistinguishedName(String commonName) {
        return "CN=" + commonName.replace('=', '-').replace(',', '-');
    }

    /**
     * Generate a Key Pair
     *
     * @param keySize the key size, in bits
     * @return the generated key pair
     * @throws NoSuchAlgorithmException
     */
    public static KeyPair generateKeyPair(int keySize) throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(keySize);
        return keyPairGenerator.generateKeyPair();
    }
}
