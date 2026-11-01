<?php
/**
 * LocalCloud Kit — saved servers on the Adminer login page.
 *
 * Servers are read on every request from:
 *   /etc/adminer/servers.json   bundled services (PostgreSQL)
 *   /adminer-servers/*.json     RDS instances, written by the LocalCloud API
 * Each file holds one entry or a list of entries:
 *   {"label", "driver": "pgsql"|"server", "server": "host:port", "username", "password", "db"?}
 * ("server" is Adminer's driver name for MySQL/MariaDB.)
 *
 * The login page gets a one-click button per saved server (logs in with the
 * saved credentials); the normal login form stays below for anything else.
 */
class LocalCloudServers extends Adminer\Plugin {
	/** @var array<string, array> */
	private $servers = array();

	function __construct(array $files) {
		foreach ($files as $file) {
			$data = json_decode((string) @file_get_contents($file), true);
			if (!is_array($data)) {
				continue;
			}
			foreach (isset($data["label"]) ? array($data) : $data as $entry) {
				if (is_array($entry) && !empty($entry["label"]) && !empty($entry["server"]) && !empty($entry["driver"])) {
					$this->servers[$entry["label"]] = $entry;
				}
			}
		}

		// A saved-server button posts lck_server=<label> along with the login form;
		// turn that into a normal Adminer login with the saved credentials.
		$label = isset($_POST["lck_server"]) ? (string) $_POST["lck_server"] : "";
		if ($label !== "" && isset($this->servers[$label]) && isset($_POST["auth"]) && is_array($_POST["auth"])) {
			$saved = $this->servers[$label];
			$_POST["auth"]["driver"] = $saved["driver"];
			$_POST["auth"]["server"] = $saved["server"];
			$_POST["auth"]["username"] = isset($saved["username"]) ? $saved["username"] : "";
			$_POST["auth"]["password"] = isset($saved["password"]) ? $saved["password"] : "";
			$_POST["auth"]["db"] = isset($saved["db"]) ? $saved["db"] : "";
		}
	}

	/** Printed inside Adminer's login <form>, so each server is a submit button on that form. */
	function loginForm() {
		if (!$this->servers) {
			return null;
		}
		$preselect = isset($_GET["lck"]) ? (string) $_GET["lck"] : "";
		// Pressing Enter submits with the form's first submit button; keep that a
		// plain login so typing credentials below doesn't pick a saved server.
		echo "<button type='submit' class='lck-default' tabindex='-1' aria-hidden='true'></button>\n";
		echo "<div class='lck-servers'>\n<h3>Saved servers</h3>\n";
		foreach ($this->servers as $label => $entry) {
			$engine = isset($entry["engine"]) ? $entry["engine"] : ($entry["driver"] == "pgsql" ? "PostgreSQL" : "MySQL");
			$who = (isset($entry["username"]) ? $entry["username"] . "@" : "") . $entry["server"];
			echo "<p class='lck-server'><button type='submit' name='lck_server' value='" . Adminer\h($label) . "'"
				. ($preselect === $label ? " autofocus" : "") . ">" . Adminer\h($label) . "</button>"
				. " <span class='lck-meta'>" . Adminer\h($engine . " · " . $who) . "</span></p>\n";
		}
		echo "<p class='lck-meta'>Or sign in to another server:</p>\n</div>\n";
		echo "<style>.lck-servers{margin:0 0 1.5em}.lck-server{margin:.35em 0}.lck-server button{min-width:14em;text-align:left;cursor:pointer}.lck-meta{color:#777;font-size:90%}.lck-default{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}</style>\n";
		return null;
	}
}

return new LocalCloudServers(array_merge(
	array("/etc/adminer/servers.json"),
	glob("/adminer-servers/*.json") ?: array()
));
