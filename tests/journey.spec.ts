import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page, name = "Camille") {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Famille Atelier", exact: true })
    .click();
  await page.getByRole("radio", { name: new RegExp(name) }).check();
  const attempt = () =>
    Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/auth/login") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Entrer dans mon espace" }).click(),
    ]);
  let [response] = await attempt();
  if (response.status() === 429) {
    // The complete responsive suite can exceed 20 logins per minute.
    // Respect the real limiter rather than disabling production protection.
    test.setTimeout(95_000);
    await expect(
      page.getByRole("alert").filter({ hasText: "Patiente une minute" }),
    ).toContainText("Patiente une minute");
    await page.waitForTimeout(60_100);
    [response] = await attempt();
  }
  expect(response.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: `Bonjour ${name}.` }),
  ).toBeVisible();
}

async function navigate(page: Page, name: string) {
  const sidebar = page
    .locator(".club-sidebar")
    .getByRole("link", { name, exact: true });
  if (await sidebar.isVisible()) {
    await sidebar.click();
    return;
  }
  const mobile = page.getByRole("button", {
    name: "Ouvrir le menu",
    exact: true,
  });
  if (await mobile.isVisible()) {
    await mobile.click();
    await page
      .getByRole("navigation", { name: "Tous les espaces", exact: true })
      .getByRole("link", { name, exact: true })
      .click();
  } else {
    await page
      .getByRole("button", { name: "Rechercher un espace", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Rechercher un espace" })
      .fill(name);
    await page
      .getByRole("navigation", { name: "Résultats de recherche" })
      .getByRole("link")
      .first()
      .click();
  }
}

test("adult: navigation, persistent preferences and goals, family, guided discovery", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Espace famille");
  await expect(
    page.locator(".family-member-list").getByRole("button", { name: /Noé/ }),
  ).toBeVisible();
  await expect(
    page.locator(".family-member-list").getByRole("button", { name: /Lila/ }),
  ).toBeVisible();
  await expect(page.getByText("Sami", { exact: true })).toHaveCount(0);
  await navigate(page, "Préférences");
  await page
    .getByLabel("Comment veux-tu appeler Suzanne ?")
    .fill("Suzanne test");
  await page
    .getByRole("button", { name: "Enregistrer mes préférences" })
    .click();
  await expect(page.getByRole("status")).toContainText("enregistrées");
  await page.reload();
  await expect(
    page.getByLabel("Comment veux-tu appeler Suzanne ?"),
  ).toHaveValue("Suzanne test");
  await page.getByLabel("Comment veux-tu appeler Suzanne ?").fill("Suzanne");
  await page
    .getByRole("button", { name: "Enregistrer mes préférences" })
    .click();
  await expect(page.getByRole("status")).toBeVisible();
  await navigate(page, "Progression");
  const goal = `[E2E] Lire un chapitre (${test.info().project.name})`;
  const goalButton = page.getByRole("button", { name: goal, exact: true });
  if ((await goalButton.count()) === 0) {
    await page.getByLabel("Un prochain petit pas").fill(goal);
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  }
  await expect(goalButton).toBeVisible();
  if ((await goalButton.getAttribute("aria-pressed")) === "true") {
    await goalButton.click();
    await expect(goalButton).toHaveAttribute("aria-pressed", "false");
  }
  await goalButton.click();
  await expect(page.getByRole("button", { name: goal })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await navigate(page, "Découvertes");
  await page.getByRole("button", { name: /Les visages de la Lune/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "De la Lune elle-même", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Un indice");
  await page.getByRole("button", { name: "Du Soleil", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Exactement");
  await page.getByRole("button", { name: "Fermer la découverte" }).click();
  for (const [link, heading] of [
    ["Actualités", "Le monde aujourd’hui."],
    ["Lectures", "Mes lectures."],
    ["Studio", "Le studio de Suzanne."],
  ]) {
    await navigate(page, link);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Menu du profil Camille" }).click();
  await page
    .getByRole("button", { name: "Se déconnecter et changer de profil" })
    .click();
  await expect(
    page.getByRole("button", { name: "Entrer dans mon espace" }),
  ).toBeVisible();
});

test("child protection, responsive layout and accessibility", async ({
  page,
}, info) => {
  await login(page, "Noé");
  await expect(
    page.getByText("Qu’est-ce qu’on découvre ensemble aujourd’hui ?"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Espace famille" })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `artifacts/${info.project.name}-home.png`,
    fullPage: true,
    scale: "css",
  });
  await page.goto("/#famille");
  await expect(
    page.getByText("Ton responsable peut modifier ces informations."),
  ).toBeVisible();
  const response = await page.request.get("/api/households/horizon/dashboard");
  expect(response.status()).toBe(404);
});

test("second household and senior reading size", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Famille Horizon", exact: true })
    .click();
  await page.getByRole("radio", { name: /Rose/ }).check();
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Rose." }),
  ).toBeVisible();
  await expect(page.locator(".shell")).toHaveClass(/large-text/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await navigate(page, "Espace famille");
  await expect(
    page.locator(".family-member-list").getByRole("button", { name: /Sami/ }),
  ).toBeVisible();
  await expect(
    page.locator(".family-member-list").getByRole("button", { name: /Noé/ }),
  ).toHaveCount(0);
});

test("PWA manifest and safe offline fallback", async ({ page, context }) => {
  await page.goto("/");
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(2);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const keys = await page.evaluate(async () => {
    const cache = await caches.open("suzanne-public-v1");
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(keys).toEqual(["/offline.html"]);
  await context.setOffline(true);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Une petite pause." }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("capitales: two players receive five distinct questions and fair scores", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Jeux");
  await page.getByLabel("Nombre de joueurs").selectOption("2");
  await page.getByRole("button", { name: "Commencer la partie" }).click();
  const seen = new Set<string>();
  const capitals: Record<string, string> = {
    France: "Paris",
    Italie: "Rome",
    Espagne: "Madrid",
    Portugal: "Lisbonne",
    Allemagne: "Berlin",
    Belgique: "Bruxelles",
    Grèce: "Athènes",
    "Royaume-Uni": "Londres",
    Irlande: "Dublin",
    Norvège: "Oslo",
    Suède: "Stockholm",
    Finlande: "Helsinki",
    Danemark: "Copenhague",
    Pologne: "Varsovie",
    Autriche: "Vienne",
    Japon: "Tokyo",
    Canada: "Ottawa",
    Australie: "Canberra",
    Maroc: "Rabat",
    Sénégal: "Dakar",
  };
  for (let i = 0; i < 10; i++) {
    await expect(
      page.getByRole("heading", { name: `À toi, Joueur ${(i % 2) + 1}.` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Je suis prêt" }).click();
    const country = (await page.locator(".country-name").textContent())!;
    expect(seen.has(country)).toBe(false);
    seen.add(country);
    await page
      .getByLabel("Ta réponse")
      .fill(capitals[country].normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    await page.getByRole("button", { name: "Vérifier ma réponse" }).click();
    await expect(page.getByRole("status")).toContainText("Bien joué");
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Bravo pour cette exploration !" }),
  ).toBeVisible();
  await expect(page.locator(".score-list p")).toHaveText([
    "Joueur 15 / 5",
    "Joueur 25 / 5",
  ]);
  await page
    .getByRole("button", { name: "Enregistrer le résultat", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Résultat enregistré");
  await navigate(page, "Espace famille");
  await page
    .getByRole("button", { name: "Parties enregistrées", exact: true })
    .click();
  await expect(page.locator(".family-document-list")).toContainText(
    "Joueur 1 : 5/5",
  );
});

test("petit bac: hidden turns and collective validation for four players", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Jeux");
  await page.getByRole("button", { name: /Le petit bac/ }).click();
  await page.getByLabel("Nombre de joueurs").selectOption("4");
  await page.getByRole("button", { name: "Commencer la partie" }).click();
  const letters = "ABCDEFGHLMPRSTV";
  const names = [
    "Alice",
    "Béatrice",
    "Camille",
    "Denis",
    "Émile",
    "Fabien",
    "Gabriel",
    "Hélène",
    "Louis",
    "Marie",
    "Paul",
    "Rose",
    "Sami",
    "Thomas",
    "Victor",
  ];
  const letter = (await page.locator(".game-symbol").textContent())!;
  const name = names[letters.indexOf(letter)];
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Je suis prêt" }).click();
    await expect(page.getByLabel("Prénom", { exact: true })).toHaveValue("");
    await page.getByLabel("Prénom", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Garder mes réponses" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "À vous de vérifier !" }),
  ).toBeVisible();
  const checks = page.locator(".bac-review input:not(:disabled)");
  await expect(checks).toHaveCount(4);
  for (let i = 0; i < 4; i++) await checks.nth(i).check();
  await expect(page.locator(".score-list p")).toHaveText([
    "Joueur 15 points",
    "Joueur 25 points",
    "Joueur 35 points",
    "Joueur 45 points",
  ]);
});

test("notebook persists privately, and live permission stays unavailable", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Carnet");
  const title = `Lecture fictive ${Date.now()}`;
  await page.getByLabel("Titre", { exact: true }).fill(title);
  await page.getByLabel("Matière ou auteur").fill("Auteur fictif");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("enregistrée");
  await page.reload();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page
    .getByRole("button", { name: `Supprimer ${title}`, exact: true })
    .click();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  await navigate(page, "Espace famille");
  await page
    .getByRole("button", { name: "Budget & vidéo", exact: true })
    .click();
  const allow = page.getByLabel("Autoriser le futur mode vidéo dans ce foyer");
  await allow.check();
  await expect(allow).toBeEnabled();
  await page.reload();
  await page
    .getByRole("button", { name: "Budget & vidéo", exact: true })
    .click();
  await expect(allow).toBeChecked();
  await expect(
    page.getByText(/Le service vidéo n’est pas encore connecté/),
  ).toBeVisible();
  await allow.uncheck();
  await expect(allow).toBeEnabled();
  await navigate(page, "Programmes");
  await page
    .getByRole("combobox", { name: "Classe", exact: true })
    .selectOption("4e");
  await page
    .getByRole("combobox", { name: "Matière", exact: true })
    .selectOption("anglais");
  await expect(page.locator(".curriculum-list")).not.toContainText(
    "rentrée 2027",
  );
  await page.getByLabel("Voir aussi les autres années").check();
  await expect(page.locator(".curriculum-list")).toContainText("rentrée 2027");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("Suzanne is visible before login, with optional motion and voice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bonjour, moi c’est Suzanne." }),
  ).toBeVisible();
  await expect(page.locator(".public-portrait img")).toBeVisible();
  const animation = page.getByRole("button", {
    name: "Animer le portrait",
    exact: true,
  });
  await expect(animation).toHaveAttribute("aria-pressed", "false");
  await animation.click();
  await expect(page.locator(".public-portrait")).toHaveClass(/is-animated/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".public-portrait img")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page
    .getByRole("button", { name: "Arrêter l’animation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Écouter Suzanne", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("private local profile selection never prefills the demo password", async ({
  page,
}) => {
  await page.route("**/api/demo/accounts", (route) =>
    route.fulfill({
      json: [
        {
          id: "local-example",
          name: "Profil test",
          email: "local-example@local.invalid",
          age: 40,
          role: "guardian",
          household: "Foyer local fictif",
          demo: false,
        },
      ],
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("radio", { name: /Profil test/ })).toBeChecked();
  await expect(
    page.getByLabel("Mot de passe local", { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByText("Suzanne-demo-2026!", { exact: true }),
  ).toHaveCount(0);
});

test("wardrobe persists per profile, updates the welcome and supports seasonal mode", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Vestiaire");
  await expect(
    page.getByRole("heading", { name: "Le vestiaire de Suzanne." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Porter la tenue Noël" }).click();
  await expect(
    page.getByRole("button", { name: "Porter la tenue Noël" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Au rythme des saisons")).not.toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Porter la tenue Noël" }),
  ).toHaveAttribute("aria-pressed", "true");
  await navigate(page, "Accueil");
  await expect(page.locator(".welcome-photo img")).toHaveAttribute(
    "alt",
    /Noël/,
  );
  await navigate(page, "Vestiaire");
  for (const [style, label] of [
    ["real", "Réaliste"],
    ["manga", "Manga"],
    ["sd", "SD"],
  ]) {
    await page.getByRole("radio", { name: label, exact: true }).check();
    await page.reload();
    await expect(
      page.getByRole("radio", { name: label, exact: true }),
    ).toBeChecked();
    await expect(
      page.getByRole("button", { name: "Porter la tenue Noël" }),
    ).toHaveAttribute("aria-pressed", "true");
    await navigate(page, "Accueil");
    await expect(page.locator(".welcome-photo img")).toHaveAttribute(
      "alt",
      new RegExp(`style ${label}, tenue Noël`),
    );
    await expect(page.locator(".welcome-photo .suzanne-presence")).toHaveClass(
      new RegExp(`style-${style}`),
    );
    await navigate(page, "Jeux");
    const expectedAsset =
      style === "sd"
        ? "/brand/suzanne-noel.png"
        : `/brand/styles/suzanne-${style}-noel.png`;
    await expect(page.locator(".game-companion")).toHaveAttribute(
      "src",
      new RegExp(encodeURIComponent(expectedAsset)),
    );
    await navigate(page, "Vestiaire");
  }
  await page.getByLabel("Au rythme des saisons").check();
  await expect(page.getByRole("status")).toContainText("mode saisonnier");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  const download = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Le pack graphique", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("suzanne-pack-v2.zip");
});

test("navigation search, active destination, history and mobile menu are usable", async ({
  page,
}) => {
  await login(page);
  const search = page.getByRole("button", {
    name: "Rechercher un espace",
    exact: true,
  });
  await search.click();
  await page
    .getByRole("textbox", { name: "Rechercher un espace" })
    .fill("tenues");
  await page
    .getByRole("navigation", { name: "Résultats de recherche" })
    .getByRole("link", { name: /Vestiaire/ })
    .click();
  await expect(page).toHaveURL(/#vestiaire$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigate(page, "Jeux");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Le vestiaire de Suzanne." }),
  ).toBeVisible();
  await search.click();
  await page
    .getByRole("textbox", { name: "Rechercher un espace" })
    .fill("zzzxxyy");
  await expect(
    page.getByText("Aucun espace trouvé. Essaie « jeux » ou « cours »."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(search).toBeFocused();
});

test("legacy appearance migrates and all three styles retain their chosen outfit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const key = "suzanne:look:v1:camille";
    if (!localStorage.getItem(key))
      localStorage.setItem(
        key,
        JSON.stringify({ style: "photo", outfit: "noel" }),
      );
  });
  await login(page);
  await navigate(page, "Vestiaire");
  await expect(
    page.getByRole("radio", { name: "Réaliste", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Porter la tenue Noël" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radio", { name: "Manga", exact: true }).check();
  await page.getByRole("button", { name: "Porter la tenue Halloween" }).click();
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "Manga", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Porter la tenue Halloween" }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const img of await page.locator(".style-card-art img").all()) {
    await expect
      .poll(() =>
        img.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  if (test.info().project.name === "desktop") {
    for (const style of ["real", "manga", "sd"])
      for (const outfit of ["rentree", "halloween", "noel", "hiver", "ete"]) {
        const path =
          style === "sd"
            ? `/brand/suzanne-${outfit}.png`
            : `/brand/styles/suzanne-${style}-${outfit}.png`;
        const response = await page.request.get(path);
        expect(response.ok(), path).toBe(true);
        expect(response.headers()["content-type"]).toContain("image/png");
      }
  }
});

test("family office edits profiles, imports and restores files, saves budget", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Espace famille");
  await page
    .locator(".family-member-list")
    .getByRole("button", { name: /Noé/ })
    .click();
  const languages = page.getByLabel("Langues étudiées", { exact: true });
  const original = await languages.inputValue();
  await languages.fill("Anglais, espagnol");
  await page
    .getByRole("button", { name: "Enregistrer le profil", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("enregistré");
  await page.reload();
  await page
    .locator(".family-member-list")
    .getByRole("button", { name: /Noé/ })
    .click();
  await expect(languages).toHaveValue("Anglais, espagnol");
  await languages.fill(original);
  await page
    .getByRole("button", { name: "Enregistrer le profil", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("enregistré");
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await page.getByLabel("Pour qui ?", { exact: true }).selectOption("noe");
  const title = `[E2E] Bulletin fictif ${test.info().project.name} ${Date.now()}`;
  await page.getByLabel("Titre du document", { exact: true }).fill(title);
  await page.getByLabel("Fichier PDF ou image").setInputFiles({
    name: "bulletin-fictif.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await page
    .getByRole("button", { name: "Importer le document", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const row = page
    .locator(".family-document-list article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  const download = page.waitForEvent("download");
  await row.getByRole("link", { name: "Télécharger", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("bulletin-fictif.pdf");
  await row
    .getByRole("button", {
      name: `Mettre à la corbeille ${title}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ouvrir la corbeille", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Restaurer ${title}`, exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("restauré");
  await page
    .getByRole("button", { name: "Voir les documents", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: `Mettre à la corbeille ${title}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("corbeille");
  await page
    .getByRole("button", { name: "Budget & vidéo", exact: true })
    .click();
  const total = page.getByLabel("Plafond total par mois (€)", { exact: true });
  const video = page.getByLabel("Dont vidéo, au maximum (€)", { exact: true });
  await expect(
    page.getByRole("button", { name: "Enregistrer les plafonds", exact: true }),
  ).toBeEnabled();
  const oldTotal = await total.inputValue(),
    oldVideo = await video.inputValue();
  await total.fill("15");
  await video.fill("5");
  await page
    .getByRole("button", { name: "Enregistrer les plafonds", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("enregistrés");
  await page.reload();
  await page
    .getByRole("button", { name: "Budget & vidéo", exact: true })
    .click();
  await expect(total).toHaveValue("15");
  await expect(video).toHaveValue("5");
  await total.fill(oldTotal);
  await video.fill(oldVideo);
  await page
    .getByRole("button", { name: "Enregistrer les plafonds", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("enregistrés");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("family questions can be created, played, saved and archived", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Espace famille");
  await page
    .getByRole("button", { name: "Questions du quiz", exact: true })
    .click();
  const title = `[E2E ${test.info().project.name}] Combien font deux plus deux ?`;
  await page.getByLabel("La question", { exact: true }).fill(title);
  await page.getByLabel("Réponse attendue", { exact: true }).fill("4");
  await page
    .getByLabel("Explication après la réponse", { exact: true })
    .fill("Deux paires forment quatre unités.");
  await page
    .getByRole("button", { name: "Enregistrer la question", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Question enregistrée");
  const seedIds: string[] = [];
  const questionRows = await (
    await page.request.get("/api/households/atelier/questions")
  ).json();
  const own = questionRows.find((q: { prompt: string }) => q.prompt === title);
  seedIds.push(own.id);
  try {
    for (let i = 0; i < 4; i++) {
      const res = await page.request.post("/api/households/atelier/questions", {
        headers: { origin: "http://localhost:3000" },
        data: {
          prompt: `[E2E] Question fictive ${i}`,
          answer: "4",
          explanation: "Exemple de test.",
          active: true,
        },
      });
      expect(res.ok()).toBe(true);
      seedIds.push((await res.json()).id);
    }
    await navigate(page, "Jeux");
    await page.getByRole("button", { name: /Quiz du foyer/ }).click();
    await expect(
      page.getByRole("button", { name: "Commencer la partie", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Commencer la partie", exact: true })
      .click();
    for (let i = 0; i < 5; i++) {
      await page
        .getByRole("button", { name: "Je suis prêt", exact: true })
        .click();
      await page.getByLabel("Ta réponse", { exact: true }).fill("4");
      await page
        .getByRole("button", { name: "Vérifier ma réponse", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Continuer", exact: true })
        .click();
    }
    await expect(page.locator(".score-list")).toContainText("5 / 5");
    await page
      .getByRole("button", { name: "Enregistrer le résultat", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Résultat enregistré");
    await navigate(page, "Espace famille");
    await page
      .getByRole("button", { name: "Parties enregistrées", exact: true })
      .click();
    await expect(page.locator(".family-document-list")).toContainText(
      "Quiz du foyer",
    );
    await page
      .getByRole("button", { name: "Questions du quiz", exact: true })
      .click();
    await page
      .locator(".family-document-list article")
      .filter({ hasText: title })
      .getByRole("button", { name: "Modifier", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Disponibilité", exact: true })
      .selectOption("archive");
    await page
      .getByRole("button", { name: "Enregistrer la question", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Question enregistrée",
    );
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toHaveCount(0);
  } finally {
    const all = await (
      await page.request.get("/api/households/atelier/questions")
    ).json();
    for (const q of all.filter((r: { id: string }) => seedIds.includes(r.id))) {
      const { id, prompt, answer, explanation } = q;
      await page.request.patch(`/api/households/atelier/questions/${id}`, {
        headers: { origin: "http://localhost:3000" },
        data: { prompt, answer, explanation, active: false },
      });
    }
  }
});
