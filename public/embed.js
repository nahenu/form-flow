/*!
 * FormFlow embed. Usage:
 *   <div data-formflow="FORM_ID"></div>
 *   <script async src="https://YOUR-FORMFLOW-HOST/embed.js"></script>
 *
 * Renders the form in an iframe (so the host page's CSS and ours never meet),
 * resizes it to fit, and forwards UTM tags and the referrer for attribution.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var origin = script && script.src ? new URL(script.src).origin : window.location.origin;
  var ID = /^[A-Za-z0-9]{1,64}$/;

  function mount(el) {
    var id = el.getAttribute("data-formflow");
    if (!id || !ID.test(id) || el.hasAttribute("data-formflow-mounted")) return;
    el.setAttribute("data-formflow-mounted", "");

    var host = new URLSearchParams(window.location.search);
    var query = new URLSearchParams({ embed: "1" });
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (key) {
      var value = host.get(key);
      if (value) query.set(key, value.slice(0, 200));
    });
    if (document.referrer) query.set("ff_ref", document.referrer.slice(0, 500));

    var frame = document.createElement("iframe");
    frame.src = origin + "/f/" + id + "?" + query.toString();
    frame.title = el.getAttribute("data-title") || "Form";
    frame.loading = "lazy";
    // No color-scheme here: a mismatch with the framed page makes browsers paint an opaque backdrop.
    frame.style.cssText = "display:block;width:100%;height:560px;border:0;background:transparent;";
    el.appendChild(frame);
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (event.origin !== origin || !data || data.type !== "formflow:height" || typeof data.height !== "number") return;
    var frames = document.querySelectorAll("[data-formflow] > iframe");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) frames[i].style.height = Math.min(Math.max(data.height, 200), 5000) + "px";
    }
  });

  function scan() {
    var nodes = document.querySelectorAll("[data-formflow]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }
  scan();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
})();
