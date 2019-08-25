package com.gmt2001.datastore;

public class KeyValue {
  public KeyValue(String key, String value) {
    this.key = key;
    this.value = value;
  }

  public String getKey() {
    return key;
  }

  public String getValue() {
    return value;
  }

  private String key;
  private String value;
}
